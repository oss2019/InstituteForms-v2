import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListOfLeaves from '../../Components/ListOfLeaves/ListOfLeaves'; // Import the ListOfLeaves component
import ListOfOutings from '../../Components/ListOfOutings/ListOfOutings'; // Import the ListOfOutings component
import './StaffDashboard.css'; // Import styles
import Dashboard from '../../Components/WardenDashboard/Dashboard';
import toast, { Toaster } from "react-hot-toast";

function StaffDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard'); // Set default active section
  const [direction, setDirection] = useState('down');
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Logout successful!"); // Show toast immediately
    setTimeout(() => {
       localStorage.removeItem('token');
      navigate(`/`);
    }, 1700); // Navigate after 2 seconds
  };

  const handleSectionChange = (newSection) => {
    setDirection(newSection === 'dashboard' ? 'up' : 'down'); // Set animation direction based on section
    setTimeout(() => setActiveSection(newSection), 300); // Change section after the animation
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'listOfLeaves':
        return <ListOfLeaves />; // Render ListOfLeaves component
      case 'listOfOutings':
        return <ListOfOutings />; // Render ListOfOutings component
      default:
        return <Dashboard />; // Fallback to dashboard
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
            Staff Dashboard
          </button>
        </h2>
        <ul className="sidebar-menu">
          <li>
            <button 
              className={`sidebar-button ${activeSection === 'listOfLeaves' ? 'active' : ''}`}
              onClick={() => handleSectionChange('listOfLeaves')} // Change section to List of Leaves
            >
              List of Event Approvals
            </button>
          </li>
          <li>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
      <div className={`content ${direction}`}>
        {renderContent()} {/* Render the content based on the active section */}
      </div>
    </div>
  );
}

export default StaffDashboard;
