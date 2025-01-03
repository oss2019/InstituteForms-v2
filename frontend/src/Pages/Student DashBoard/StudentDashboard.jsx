import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePage from '../../Components/ProfilePage/ProfilePage';
import EventForm from '../../Components/EventForm/EventForm'; // Import EventForm component
import './StudentDashboard.css'; // Import styles
import Dashboard from '../../Components/StudentDashboard/Dashboard';
import toast, { Toaster } from "react-hot-toast";

function StudentDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [direction, setDirection] = useState('down');
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Logout successful!"); // Show toast immediately
    setTimeout(() => {
       localStorage.removeItem('token');
       localStorage.removeItem('email');
       localStorage.removeItem('user-info');
       localStorage.removeItem('userID');
      navigate(`/`);
    }, 1700); // Navigate after 2 seconds
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
      case 'eventForm':
        return <EventForm />;
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
          </button>
        </h2>
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
              className={`sidebar-button ${activeSection === 'eventForm' ? 'active' : ''}`}
              onClick={() => handleSectionChange('eventForm')}
            >
              Submit Event Proposal
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
