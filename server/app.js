const express = require('express');
const path = require('path');
const cors = require('cors');
const progressRoutes = require('./routes/progressRoutes');
const toeicUploadRoutes = require('./routes/toeicUploadRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const coursesRoutes = require('./routes/coursesRoutes');
const topicsRoutes = require('./routes/topicsRoutes');
const srsRoutes = require('./routes/srsRoutes');
const toeicRoutes = require('./routes/toeicRoutes');
const wordProgressRoutes = require('./routes/wordProgressRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');


const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads/toeic', express.static(path.join(__dirname, 'uploads/toeic')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/srs', srsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/word-progress', wordProgressRoutes);
app.use('/api/toeic-upload', toeicUploadRoutes);
app.use('/api/toeic', toeicRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);


module.exports = app;
