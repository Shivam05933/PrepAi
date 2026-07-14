import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prep-ai';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'PrepAI backend server is running smoothly',
    timestamp: new Date(),
    mongoStatus: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

app.use(notFound);
app.use(errorHandler);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB database.');
    app.listen(PORT, () => {
      console.log(`🚀 Server is listening at http://localhost:${PORT}`);
      console.log(`📡 Health check URL: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB database connection error:', err.message);
    process.exit(1);
  });
