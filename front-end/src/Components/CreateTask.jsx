import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CreateTask.css';

const CreateTask = () => {
  const [task, setTask] = useState({ 
    title: '', 
    description: '', 
    assignee: '', 
    assigneeEmail: '',
    priority: '', 
    status: 'To Do',
    dueDate: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setTask({ ...task, [name]: value });
    // Clear messages when user starts typing
    if (success) setSuccess(false);
    if (error) setError('');
    if (name === 'assigneeEmail') setEmailError('');
    if (name === 'assignee') setNameError('');
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Reset all states
    setError('');
    setSuccess(false);
    setEmailSent(false);
    setNameError('');
    setEmailError('');

    // Validate assignee name
    if (!task.assignee.trim()) {
      setNameError('Assignee name is required');
      return;
    }

    // Validate assignee email
    if (!task.assigneeEmail.trim()) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(task.assigneeEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(task)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      // Show success message
      setSuccess(true);
      setEmailSent(true);
      
      // Clear form
      setTask({ 
        title: '', 
        description: '', 
        assignee: '', 
        assigneeEmail: '',
        priority: '', 
        status: 'To Do',
        dueDate: ''
      });

    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task. Please try again.');
      setSuccess(false);
      setEmailSent(false);
    }
  };

  return (
    <div className="create-task">
      <h2 className="animated-heading">Create Task</h2>
      
      {/* Success Message */}
      {success && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#dcfce7',
          border: '1px solid #bbf7d0',
          borderRadius: '0.5rem',
          textAlign: 'center',
          color: '#166534',
          fontWeight: 500
        }}>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            Task created successfully!
          </div>
          {emailSent && (
            <div style={{ fontSize: '0.9rem', color: '#15803d' }}>
              A notification email has been sent to the assignee.
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#dc2626',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          name="title"
          placeholder="Title"
          className="form-input"
          value={task.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          className="form-textarea"
          value={task.description}
          onChange={handleChange}
          required
        />
        <div className="form-group">
          <input
            name="assignee"
            placeholder="Assignee Name"
            className={`form-input ${nameError ? 'input-error' : ''}`}
            value={task.assignee}
            onChange={handleChange}
            required
          />
          {nameError && (
            <div className="error-text">{nameError}</div>
          )}
        </div>
        <div className="form-group">
          <input
            name="assigneeEmail"
            type="email"
            placeholder="Assignee Email"
            className={`form-input ${emailError ? 'input-error' : ''}`}
            value={task.assigneeEmail}
            onChange={handleChange}
            required
          />
          {emailError && (
            <div className="error-text">{emailError}</div>
          )}
        </div>
        <input
          type="date"
          name="dueDate"
          className="form-input"
          value={task.dueDate}
          onChange={handleChange}
          required
        />
        <select
          name="priority"
          className="form-select"
          value={task.priority}
          onChange={handleChange}
          required
        >
          <option value="">Priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select
          name="status"
          className="form-select"
          value={task.status}
          onChange={handleChange}
          required
        >
          <option value="">Status</option>
          <option>To Do</option>
          <option>In Progress</option>
          <option>Complete</option>
        </select>
        <button type="submit" className="btn-primary">Create</button>
      </form>
    </div>
  );
};

export default CreateTask;
