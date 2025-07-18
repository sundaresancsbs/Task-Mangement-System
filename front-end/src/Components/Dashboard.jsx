import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await res.json();
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-message">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Task Manager Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.firstName} {user?.lastName}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button onClick={() => navigate('/create-task')} className="action-btn">
              Create New Task
            </button>
            <button onClick={() => navigate('/tasks')} className="action-btn">
              View All Tasks
            </button>
            <button onClick={() => navigate('/profile')} className="action-btn">
              View Profile
            </button>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stats-card">
            <h3>Total Tasks</h3>
            <p>{tasks.length}</p>
          </div>
          <div className="stats-card">
            <h3>In Progress</h3>
            <p>{tasks.filter(t => t.status === 'In Progress').length}</p>
          </div>
        </div>
        <div className="task-list">
          <h3>Upcoming Tasks</h3>
          {tasks.length === 0 ? (
            <p>No tasks found. Create your first task!</p>
          ) : (
            <ul>
              {tasks.map((task) => (
                <li key={task._id}>
                  <strong>{task.title}</strong> - Due: {new Date(task.dueDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
