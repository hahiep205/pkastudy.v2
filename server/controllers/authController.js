const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('../firebase-admin');
const {
  getUserByEmail,
  createUser,
  createUserFromGoogle,
  createProgressRecordForUser,
} = require('../models/userModel');
const { sendVerificationCodeEmail } = require('../services/emailService');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().trim().min(2).optional().allow('', null),
  code: Joi.string().length(6).required(),
});

const sendCodeSchema = Joi.object({
  email: Joi.string().email().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const googleLoginSchema = Joi.object({
  idToken: Joi.string().required(),
});

const pendingVerificationCodes = new Map();

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

function verifyCode(email, code) {
  const record = pendingVerificationCodes.get(email);
  if (!record) {
    return { valid: false, error: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' };
  }

  if (Date.now() > record.expiresAt) {
    clearVerificationCode(email);
    return { valid: false, error: 'Mã xác thực đã hết hạn. Vui lòng gửi lại mã.' };
  }

  if (record.code !== code) {
    record.attemptsLeft -= 1;
    if (record.attemptsLeft <= 0) {
      clearVerificationCode(email);
      return { valid: false, error: 'Mã xác thực không hợp lệ. Vui lòng gửi lại mã.' };
    }

    return {
      valid: false,
      error: `Mã xác thực không đúng. Còn ${record.attemptsLeft} lần thử.`,
    };
  }

  return { valid: true };
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
      return res.status(400).json({ error: 'Email đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' });
    }

    const verificationCode = generateVerificationCode();
    await sendVerificationCodeEmail({ email: value.email, code: verificationCode });
    storeVerificationCode(value.email, verificationCode);

    res.json({ message: 'Mã xác thực đã được gửi tới email của bạn.' });
  } catch (err) {
    next(err);
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

    const verification = verifyCode(value.email, value.code);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    clearVerificationCode(value.email);
    const user = await createUser(value);
    await createProgressRecordForUser(user.id);

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (err) {
    next(err);
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

    const user = await getUserByEmail(value.email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(value.password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function googleLogin(req, res, next) {
  try {
    const { error, value } = googleLoginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    let decodedToken;
    const isFirebaseConfigured = admin.apps && admin.apps.length > 0;
    if (isFirebaseConfigured) {
      decodedToken = await admin.auth().verifyIdToken(value.idToken);
    } else {
      console.warn("Firebase Admin is not initialized. Decoding token without signature verification for development.");
      decodedToken = jwt.decode(value.idToken);
      if (!decodedToken) {
        return res.status(400).json({ error: 'Mã token Google không hợp lệ.' });
      }
    }
    const { email, name } = decodedToken;

    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUserFromGoogle({ email, name });
      await createProgressRecordForUser(user.id);
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendVerificationCode,
  register,
  login,
  googleLogin,
};
