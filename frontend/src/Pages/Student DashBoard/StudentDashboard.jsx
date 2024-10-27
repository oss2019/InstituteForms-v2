import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePage from '../../Components/ProfilePage/ProfilePage';
import ApplyLeave from '../../Components/ApplyLeave/ApplyLeave';
import ApplyOuting from '../../Components/ApplyOuting/ApplyOuting';
import './StudentDashboard.css'; // Import styles
import Dashboard from '../../Components/StudentDashboard/Dashboard';

function StudentDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [direction, setDirection] = useState('down');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSectionChange = (newSection) => {
    setDirection(newSection === 'dashboard' ? 'up' : 'down');
    setTimeout(() => setActiveSection(newSection), 300);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <ProfilePage />;
      case 'applyLeave':
        return <ApplyLeave />;
      case 'applyOuting':
        return <ApplyOuting />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2 className="sidebar-title">
          <button 
              className={`sidebar-button ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleSectionChange('dashboard')}
            >
              Student Dashboard
          </button></h2>
        <ul className="sidebar-menu">
          <li>
            <button 
              className={`sidebar-button ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => handleSectionChange('profile')}
            >
              Profile
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-button ${activeSection === 'applyLeave' ? 'active' : ''}`}
              onClick={() => handleSectionChange('applyLeave')}
            >
              Apply for Leave
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-button ${activeSection === 'applyOuting' ? 'active' : ''}`}
              onClick={() => handleSectionChange('applyOuting')}
            >
              Apply for Outing
            </button>
          </li>
          <li>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
      <div className={`content ${direction}`}>
        {renderContent()}
      </div>
    </div>
  );
}

export default StudentDashboard;
