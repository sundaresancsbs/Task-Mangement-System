const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Task = require('./models/Task');
const User = require('./models/User');
const auth = require('./middleware/auth');
const { sendTaskAssignmentEmail } = require('./services/emailService');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

// MongoDB Connection Configuration
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager';

const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Successfully connected to MongoDB.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

// Authentication Routes
app.post('/api/signup', async (req, res) => {
  try {
    console.log('Signup request received:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists with email:', req.body.email);
      return res.status(400).json({ 
        error: 'Email already registered. Please use a different email or try logging in.' 
      });
    }

    // Create new user with trimmed and lowercase email
    const user = new User({
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      email: req.body.email.toLowerCase().trim(),
      password: req.body.password
    });

    console.log('Attempting to save user with email:', user.email);
    await user.save();
    console.log('User saved successfully with ID:', user._id);
    
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }, 
      token 
    });
  } catch (err) {
    console.error('Signup error details:', {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack
    });
    
    if (err.code === 11000) {
      res.status(400).json({ 
        error: 'Email already registered. Please use a different email or try logging in.' 
      });
    } else if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      console.log('Validation errors:', validationErrors);
      res.status(400).json({ 
        error: validationErrors.join(', ')
      });
    } else {
      res.status(500).json({ 
        error: 'An error occurred during signup. Please try again.' 
      });
    }
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
    res.json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      },
      token 
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Get current user
app.get('/api/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected Routes
app.post('/api/tasks', auth, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      owner: req.user._id
    });
    await task.save();

    // Send email notification if assignee email is provided
    if (task.assigneeEmail) {
      try {
        await sendTaskAssignmentEmail(task.assigneeEmail, task);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the task creation if email fails
        // Just log the error and continue
      }
    }

    res.status(201).json({
      message: 'Task created successfully',
      task,
      emailSent: task.assigneeEmail ? true : false
    });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.user._id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', auth, async (req, res) => {
  try {
    console.log('Delete task request received for ID:', req.params.id);
    console.log('User ID:', req.user._id);

    const task = await Task.findOneAndDelete({ 
      _id: req.params.id,
      owner: req.user._id 
    });

    if (!task) {
      console.log('Task not found or not owned by user');
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('Task deleted successfully:', task._id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
