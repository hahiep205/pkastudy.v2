import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function getExpressApp() {
  return require('../server/app.js');
}
