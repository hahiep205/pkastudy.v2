const {
  fetchAdminUsers,
  fetchAdminUser,
  changeAdminUserRole,
  changeAdminUserStatus,
} = require('../services/adminUserService');

async function getUsers(req, res, next) {
  try {
    const data = await fetchAdminUsers(req.query);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const data = await fetchAdminUser(req.params.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const data = await changeAdminUserRole(req.userId, req.params.userId, req.body?.role);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const data = await changeAdminUserStatus(req.userId, req.params.userId, req.body?.status);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
};
