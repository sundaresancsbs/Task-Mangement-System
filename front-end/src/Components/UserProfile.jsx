import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile data
        const userRes = await fetch('http://localhost:5000/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userRes.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await userRes.json();
        setUserData(userData);

        // Fetch user's tasks
        const tasksRes = await fetch('http://localhost:5000/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!tasksRes.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const tasks = await tasksRes.json();
        setUserTasks(tasks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  if (loading) {
    return (
      <div className="user-profile">
        <div className="loading-message">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <img 
          src={`https://ui-avatars.com/api/?name=${userData?.firstName}+${userData?.lastName}&background=6366f1&color=fff`} 
          alt="Profile" 
        />
        <div>
          <h2>
            {userData?.firstName} {userData?.lastName}
          </h2>
          <p>{userData?.email}</p>
        </div>
      </div>

      <section className="profile-section">
        <h3>
          <span role="img" aria-label="tasks">📝</span>
          My Tasks
        </h3>
        {userTasks.length === 0 ? (
          <div className="no-tasks-message">No tasks assigned yet.</div>
        ) : (
          <ul className="task-list">
            {userTasks.map((task) => (
              <li key={task._id} className="task-item">
                <div className="task-header">
                  <span className="task-title">{task.title}</span>
                  <span className={`status-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                </div>
                <p className="task-description">{task.description}</p>
                <div className="task-footer">
                  <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                  {task.assignee && (
                    <span className="assignee-badge">
                      👤 {task.assignee}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default UserProfile;
