const { Readable } = require('stream');
const { getOrSet } = require('../lib/ttlCache');

const NON_STREAM_CACHE_TTL_MS = 5 * 60 * 1000;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeValue(value[key]);
        return acc;
      }, {});
  }

  return value;
}

function buildCacheKey(body) {
  return JSON.stringify(normalizeValue(body || {}));
}

async function fetchUpstream(upstreamUrl, apiKey, body) {
  const upstreamResponse = await fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body || {}),
  });

  const contentType = upstreamResponse.headers.get('content-type') || '';

  return {
    status: upstreamResponse.status,
    contentType,
    bodyText: await upstreamResponse.text(),
  };
}

async function proxyAiChatCompletion(req, res, next) {
  try {
    const upstreamUrl = process.env.AI_UPSTREAM_URL;
    const apiKey = process.env.AI_UPSTREAM_KEY;

    if (!upstreamUrl || !apiKey) {
      return res.status(500).json({
        error: {
          message: 'AI configuration is missing. Please set AI_UPSTREAM_URL and AI_UPSTREAM_KEY in .env.',
        },
      });
    }

    const requestBody = req.body || {};
    const shouldCache = requestBody.stream === false;

    if (shouldCache) {
      const cacheKey = `ai:${buildCacheKey(requestBody)}`;
      const cachedResult = await getOrSet(cacheKey, NON_STREAM_CACHE_TTL_MS, () => fetchUpstream(upstreamUrl, apiKey, requestBody));

      res.status(cachedResult.status);
      if (cachedResult.contentType) {
        res.setHeader('Content-Type', cachedResult.contentType);
      }

      return res.send(cachedResult.bodyText);
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    res.status(upstreamResponse.status);

    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    if (!upstreamResponse.body) {
      const text = await upstreamResponse.text();
      return res.send(text);
    }

    return Readable.fromWeb(upstreamResponse.body).pipe(res);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  proxyAiChatCompletion,
};
