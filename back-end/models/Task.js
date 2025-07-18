const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  assignee: {
    type: String,
    required: true,
    trim: true
  },
  assigneeEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High'] },
  status: { type: String, enum: ['To Do', 'In Progress', 'Complete'], default: 'To Do' },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
