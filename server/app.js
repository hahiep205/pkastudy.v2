const express = require('express');
const cors = require('cors');
const progressRoutes = require('./routes/progressRoutes');
const toeicUploadRoutes = require('./routes/toeicUploadRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/progress', progressRoutes);
app.use('/api/toeic-upload', toeicUploadRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
