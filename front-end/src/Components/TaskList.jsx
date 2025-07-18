import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './TaskList.css';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [deleteError, setDeleteError] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch tasks');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date set';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return { text: 'No due date', status: 'no-date' };
    
    try {
      const now = new Date();
      const taskDate = new Date(dueDate);
      
      if (isNaN(taskDate.getTime())) {
        return { text: 'Invalid date', status: 'invalid' };
      }

      const diffTime = taskDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      
      if (diffDays < 0) {
        return { 
          text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`,
          status: 'overdue'
        };
      }
      
      if (diffDays === 0) {
        if (diffHours < 0) {
          return { text: 'Overdue', status: 'overdue' };
        }
        return { text: 'Due today', status: 'due-today' };
      }
      
      if (diffDays === 1) {
        return { text: 'Due tomorrow', status: 'due-soon' };
      }
      
      if (diffDays <= 7) {
        return { text: `Due in ${diffDays} days`, status: 'due-soon' };
      }
      
      return { text: `Due in ${diffDays} days`, status: 'upcoming' };
    } catch (error) {
      return { text: 'Invalid date', status: 'invalid' };
    }
  };

  const sortTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
          const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
          return dateA - dateB;
        case 'priority':
          const priorityOrder = { High: 0, Medium: 1, Low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'status':
          const statusOrder = { 'To Do': 0, 'In Progress': 1, 'Complete': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleMenuClick = (taskId) => {
    setActiveMenu(activeMenu === taskId ? null : taskId);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      console.log('Attempting to delete task:', taskId);
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response status:', res.status);
      
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid server response');
      }

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to delete task');
      }

      console.log('Task deleted successfully:', data);
      setTasks(tasks.filter(task => task._id !== taskId));
      setDeleteError('');
      setActiveMenu(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      setDeleteError(err.message || 'Failed to delete task. Please try again.');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu && !event.target.closest('.task-menu')) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  if (loading) {
    return (
      <div className="task-list">
        <div className="loading-message">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-list">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const sortedTasks = sortTasks(tasks);

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h2>Task List</h2>
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by:</label>
          <select 
            id="sort-select" 
            value={sortBy} 
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {deleteError && (
        <div className="error-message">{deleteError}</div>
      )}

      {tasks.length === 0 ? (
        <div className="no-tasks-message">No tasks found. Create your first task!</div>
      ) : (
        <div className="tasks-grid">
          {sortedTasks.map((task) => {
            const timeRemaining = getTimeRemaining(task.dueDate);
            return (
              <div 
                key={task._id} 
                className={`task-card ${timeRemaining.status}`}
              >
                <div className="task-card-header">
                  <h3>{task.title}</h3>
                  <div className="task-actions">
                    <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <div className="task-menu">
                      <button 
                        className="menu-btn"
                        onClick={() => handleMenuClick(task._id)}
                        title="Task options"
                      >
                        ⋮
                      </button>
                      {activeMenu === task._id && (
                        <div className="menu-dropdown">
                          <button 
                            className="delete-option"
                            onClick={() => handleDeleteTask(task._id)}
                          >
                            Delete Task
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="task-card-body">
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <p><strong>Assignee:</strong> {task.assignee}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>
                        {task.status}
                      </span>
                    </p>
                    <div className="due-date-info">
                      <p className="due-date">
                        <strong>Due Date:</strong> {formatDate(task.dueDate)}
                      </p>
                      <p className={`time-remaining ${timeRemaining.status}`}>
                        {timeRemaining.text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskList;
