import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PendingApprovals from '../../Components/PendingApprovals/PendingApprovals'; // Import the ListOfLeaves component
import ListOfOutings from '../../Components/ListOfOutings/ListOfOutings'; // Import the ListOfOutings component
import './StaffDashboard.css'; // Import styles
import Dashboard from '../../Components/StaffDashboard/ProcessedEventApplications';
import toast, { Toaster } from "react-hot-toast";

function StaffDashboard() {
  const [activeSection, setActiveSection] = useState('pendingApprovals'); // Set default active section
  const [direction, setDirection] = useState('down');
  const navigate = useNavigate();
  const [role, setRole] = useState('general-secretary');

  const handleLogout = () => {
    toast.success("Logout successful!"); // Show toast immediately
    setTimeout(() => {
      localStorage.removeItem('token');
      navigate(`/`);
    }, 1700); // Navigate after 2 seconds
  };

  const roleMapping = {
    'general-secretary': 'General Secretary',
    'treasurer': 'Treasurer',
    'president': 'President',
    'faculty-in-charge': 'Faculty In Charge',
    'associate-dean': 'Associate Dean',
  };

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole) {
      const displayRole = roleMapping[storedRole] || 'Staff'; // Map role or fallback to default
      setRole(displayRole);
    }
  }, []);


  const handleSectionChange = (newSection) => {
    setDirection(newSection === 'dashboard' ? 'up' : 'down'); // Set animation direction based on section
    setTimeout(() => setActiveSection(newSection), 300); // Change section after the animation
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'pendingApprovals':
        return <PendingApprovals />; // Render ListOfLeaves component
      case 'listOfOutings':
        return <ListOfOutings />; // Render ListOfOutings component
      default:
        return <Dashboard />; // Fallback to dashboard
    }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className='dashboardHeader'>
          <div>{role}</div>
          <div>Dashboard</div>
        </div>

        <ul className="sidebar-menu">
          <li className='sidebar-options'>
          <button
            className={`sidebar-button ${activeSection === 'listOfLeaves' ? 'active' : ''}`}
            onClick={() => handleSectionChange('pendingApprovals')} // Change section to List of Leaves
          >
            Pending Applications
          </button>
          </li>
          <li className='sidebar-options'>
          <button
            className={`sidebar-button ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleSectionChange('dashboard')}
          >
            Processed Event Applications
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
