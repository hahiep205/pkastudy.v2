const express = require('express');
const { toeicUpload } = require('../middlewares/uploadMiddleware');
const { uploadFiles } = require('../controllers/toeicUploadController');

const router = express.Router();

router.post('/', toeicUpload, uploadFiles);

module.exports = router;
