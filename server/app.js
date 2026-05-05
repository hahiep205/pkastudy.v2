const express = require('express');
const cors = require('cors');
const progressRoutes = require('./routes/progressRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/progress', progressRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
