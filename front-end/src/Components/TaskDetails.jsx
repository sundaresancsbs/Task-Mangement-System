import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './TaskDetails.css';

const TaskDetails = () => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reminder, setReminder] = useState(false);
  const { id } = useParams();
  const { token } = useAuth();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch task details');
        }
        
        const data = await response.json();
        setTask(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, token]);

  const handleReminderToggle = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reminder: !reminder })
      });

      if (!response.ok) {
        throw new Error('Failed to update reminder');
      }

      setReminder(!reminder);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!task) return <div className="error-message">Task not found</div>;

  return (
    <div className="task-details">
      <h2 className="task-title">{task.title}</h2>
      <div className="task-card">
        <div className="task-info">
          <p><strong>Status:</strong> <span className={`status ${task.status.toLowerCase()}`}>{task.status}</span></p>
          <p><strong>Priority:</strong> <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></p>
          <p><strong>Due Date:</strong> <span className="due-date">{formatDate(task.dueDate)}</span></p>
          <p><strong>Assignee:</strong> {task.assignee}</p>
          <p><strong>Description:</strong></p>
          <div className="description">{task.description}</div>
        </div>
        
        <div className="task-actions">
          <button 
            className={`reminder-button ${reminder ? 'active' : ''}`}
            onClick={handleReminderToggle}
          >
            {reminder ? 'Reminder Set' : 'Set Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
