require('dotenv').config();
const app = require('./app');
const { ensureDefaultAdminUser, DEFAULT_ADMIN_LOGIN_ALIAS, DEFAULT_ADMIN_PASSWORD } = require('./models/userModel');

const port = process.env.PORT || 4000;

async function startServer() {
  try {
    await ensureDefaultAdminUser();
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log(`Default admin ready: ${DEFAULT_ADMIN_LOGIN_ALIAS} / ${DEFAULT_ADMIN_PASSWORD}`);
    });
  } catch (error) {
    console.error('Failed to bootstrap default admin account:', error);
    process.exit(1);
  }
}

startServer();
