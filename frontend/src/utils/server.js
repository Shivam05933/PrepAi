import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://prep-ai-navy-theta.vercel.app',
  'https://prep-ai-git-main-shivam05933s-projects.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    console.log("Incoming Origin:", origin); 

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed: ' + origin));
    }
  },
  credentials: true
}));

app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('API running...');
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});