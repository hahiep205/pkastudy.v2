const Joi = require('joi');
const {
  getUserByEmail,
  getUserByLoginIdentifier,
  createUser,
  createUserFromAuthIdentity,
  createProgressRecordForUser,
} = require('../models/userModel');
const { sendVerificationCodeEmail } = require('../services/emailService');
const {
  createSupabaseAuthUser,
  deleteSupabaseAuthUserById,
  ensureSupabaseAuthUser,
  supabaseAdmin,
  supabasePublic,
} = require('../supabase');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().trim().min(2).optional().allow('', null),
  code: Joi.string().length(6).optional(),
  verificationCode: Joi.string().length(6).optional(),
}).or('code', 'verificationCode');

const sendCodeSchema = Joi.object({
  email: Joi.string().email().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().required(),
  password: Joi.string().required(),
});

const accessTokenSchema = Joi.object({
  accessToken: Joi.string().required(),
});

const pendingVerificationCodes = new Map();

function buildAuthPayload(user, token) {
  return {
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        status: user.status || 'active',
      },
    },
  };
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeVerificationCode(email, code) {
  pendingVerificationCodes.set(email, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attemptsLeft: 5,
  });
}

function clearVerificationCode(email) {
  pendingVerificationCodes.delete(email);
}

function getNormalizedVerificationCode(value) {
  return value.code || value.verificationCode;
}

function verifyCode(email, code) {
  const record = pendingVerificationCodes.get(email);
  if (!record) {
    return { valid: false, error: 'Ma xac thuc khong hop le hoac da het han.' };
  }

  if (Date.now() > record.expiresAt) {
    clearVerificationCode(email);
    return { valid: false, error: 'Ma xac thuc da het han. Vui long gui lai ma.' };
  }

  if (record.code !== code) {
    record.attemptsLeft -= 1;
    if (record.attemptsLeft <= 0) {
      clearVerificationCode(email);
      return { valid: false, error: 'Ma xac thuc khong hop le. Vui long gui lai ma.' };
    }

    return {
      valid: false,
      error: `Ma xac thuc khong dung. Con ${record.attemptsLeft} lan thu.`,
    };
  }

  return { valid: true };
}

async function ensureLocalUser({ email, name }) {
  let user = await getUserByEmail(email);
  if (!user) {
    user = await createUserFromAuthIdentity({ email, name });
    await createProgressRecordForUser(user.id);
  }
  return user;
}

async function getIdentityFromAccessToken(accessToken) {
  if (!supabaseAdmin) {
    const error = new Error('Supabase admin client is not configured.');
    error.status = 500;
    throw error;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error) {
    error.status = error.status || 401;
    throw error;
  }

  const authUser = data?.user;
  if (!authUser?.email) {
    const invalidTokenError = new Error('Supabase session is invalid.');
    invalidTokenError.status = 401;
    throw invalidTokenError;
  }

  return {
    authUserId: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email,
  };
}

async function sendVerificationCode(req, res, next) {
  try {
    const { error, value } = sendCodeSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const existingUser = await getUserByEmail(value.email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email da duoc su dung. Vui long dang nhap hoac dung email khac.' });
    }

    const verificationCode = generateVerificationCode();
    await sendVerificationCodeEmail({ email: value.email, code: verificationCode });
    storeVerificationCode(value.email, verificationCode);

    return res.json({ message: 'Ma xac thuc da duoc gui toi email cua ban.' });
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const existingUser = await getUserByEmail(value.email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const verification = verifyCode(value.email, getNormalizedVerificationCode(value));
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    const createdAuthUser = await createSupabaseAuthUser({
      email: value.email,
      password: value.password,
      name: value.name,
    });

    try {
      clearVerificationCode(value.email);
      const user = await createUser({
        authUserId: createdAuthUser.id,
        email: value.email,
        name: value.name,
      });
      await createProgressRecordForUser(user.id);

      return res.status(201).json({ data: { user } });
    } catch (localCreateError) {
      await deleteSupabaseAuthUserById(createdAuthUser?.id).catch(() => undefined);
      throw localCreateError;
    }
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const user = await getUserByLoginIdentifier(value.email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    if (!supabasePublic) {
      return res.status(500).json({ error: 'Supabase public client is not configured.' });
    }

    const authEmail = user.email;

    let signIn = await supabasePublic.auth.signInWithPassword({
      email: authEmail,
      password: value.password,
    });

    if (signIn.error || !signIn.data?.session?.access_token) {
      await ensureSupabaseAuthUser({
        email: authEmail,
        password: value.password,
        name: user.name,
      });

      signIn = await supabasePublic.auth.signInWithPassword({
        email: authEmail,
        password: value.password,
      });
    }

    if (signIn.error || !signIn.data?.session?.access_token) {
      return res.status(400).json({ error: signIn.error?.message || 'Invalid email or password' });
    }

    return res.json(buildAuthPayload(user, signIn.data.session.access_token));
  } catch (err) {
    return next(err);
  }
}

async function exchangeSession(req, res, next) {
  try {
    const { error, value } = accessTokenSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const identity = await getIdentityFromAccessToken(value.accessToken);
    const user = await createUserFromAuthIdentity({
      authUserId: identity.authUserId,
      email: identity.email,
      name: identity.name,
    });

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    return res.json(buildAuthPayload(user, value.accessToken));
  } catch (err) {
    return next(err);
  }
}

async function googleLogin(req, res, next) {
  try {
    const { error, value } = accessTokenSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const identity = await getIdentityFromAccessToken(value.accessToken);
    const user = await createUserFromAuthIdentity({
      authUserId: identity.authUserId,
      email: identity.email,
      name: identity.name,
    });

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    return res.json(buildAuthPayload(user, value.accessToken));
  } catch (err) {
    return next(err);
  }
}

async function getCurrentSession(req, res) {
  return res.json(buildAuthPayload(req.user, req.auth?.accessToken || null));
}

module.exports = {
  sendVerificationCode,
  register,
  login,
  googleLogin,
  exchangeSession,
  getCurrentSession,
};
