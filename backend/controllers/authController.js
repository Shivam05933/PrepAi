import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const isValidEmail = (value) => {
 return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const registerUser = async (req, res, next) => {
 try {
   const { name, email, password } = req.body;

   if (!name || !email || !password) {
     res.status(400);
     throw new Error('Name, email, and password are required');
   }

   if (!isValidEmail(email)) {
     res.status(400);
     throw new Error('Please provide a valid email address');
   }

   if (password.length < 6) {
     res.status(400);
     throw new Error('Password must be at least 6 characters long');
   }

   const existingUser = await User.findOne({ email });
   if (existingUser) {
     res.status(409);
     throw new Error('A user with that email already exists');
   }

   const user = await User.create({ name, email, password });

   const token = generateToken(user._id);
   const cookieOptions = {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
     maxAge: 7 * 24 * 60 * 60 * 1000
   };

   res.cookie('prepai_token', token, cookieOptions);

   res.status(201).json({
     id: user._id,
     name: user.name,
     email: user.email
   });
 } catch (error) {
   next(error);
 }
};

export const loginUser = async (req, res, next) => {
 try {
   const { email, password } = req.body;

   if (!email || !password) {
     res.status(400);
     throw new Error('Email and password are required');
   }

   const user = await User.findOne({ email }).select('+password');
   if (!user || !(await user.matchPassword(password))) {
     res.status(401);
     throw new Error('Invalid email or password');
   }

   const token = generateToken(user._id);
   const cookieOptions = {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
     maxAge: 7 * 24 * 60 * 60 * 1000
   };

   res.cookie('prepai_token', token, cookieOptions);

   res.status(200).json({
     id: user._id,
     name: user.name,
     email: user.email
   });
 } catch (error) {
   next(error);
 }
};

export const logoutUser = async (req, res) => {
 res.cookie('prepai_token', '', {
   httpOnly: true,
   expires: new Date(0),
   secure: process.env.NODE_ENV === 'production',
   sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
 });
 res.status(200).json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req, res) => {
 if (!req.user) {
   return res.status(401).json({ message: 'Not authenticated' });
 }

 res.status(200).json({
   id: req.user._id,
   name: req.user.name,
   email: req.user.email
 });
};