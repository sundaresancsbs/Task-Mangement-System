const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  debug: true, // Enable debug logging
  logger: true // Enable logger
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email configuration error:', error);
    console.error('Please check your .env file and make sure EMAIL_USER and EMAIL_APP_PASSWORD are set correctly');
  } else {
    console.log('Email server is ready to send messages');
  }
});

const sendTaskAssignmentEmail = async (email, task) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.warn('Email configuration is missing. Skipping email notification.');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `New Task Assigned: ${task.title}`,
      html: `
        <h2>You have been assigned a new task</h2>
        <p><strong>Title:</strong> ${task.title}</p>
        <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
        <p><strong>Priority:</strong> ${task.priority || 'Not specified'}</p>
        <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}</p>
        <p><strong>Status:</strong> ${task.status}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Task assignment email sent successfully to:', email);
  } catch (error) {
    console.error('Failed to send task assignment email:', error);
    // Don't throw the error, just log it
  }
};

module.exports = {
  sendTaskAssignmentEmail
}; 