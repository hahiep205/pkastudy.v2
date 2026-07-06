function setPublicCache(res, maxAgeSeconds, staleWhileRevalidateSeconds = maxAgeSeconds) {
  res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`);
}

module.exports = {
  setPublicCache,
};
