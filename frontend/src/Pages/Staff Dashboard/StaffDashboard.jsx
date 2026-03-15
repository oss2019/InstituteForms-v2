import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";


import PendingApprovals from '../../Components/PendingApprovals/PendingApprovals';
import ProcessedApplications from '../../Components/StaffDashboard/ProcessedEventApplications'; 

import { FiMail, FiCheckSquare, FiLogOut, FiX, FiMenu } from 'react-icons/fi';

import './StaffDashboard.css';

function StaffDashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState('Staff');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active section based on current route
  const getActiveSectionFromRoute = () => {
    if (location.pathname.includes('/staff/processed')) {
      return 'processedApplications';
    }
    return 'pendingApprovals'; // Default to pending
  };

  const activeSection = getActiveSectionFromRoute();

  // Fetches the user's role from localStorage on component mount
  useEffect(() => {
    const roleMapping = {
      'general-secretary': 'General Secretary',
      'treasurer': 'Treasurer',
      'president': 'President',
      'ARSW': 'ARSW',
      'associate-dean': 'Associate Dean',
      'associate-dean-socio-cultural': 'Associate Dean (Socio-Cult)',
      'dean': 'Dean'
    };
    const storedRole = localStorage.getItem('role');
    if (storedRole) {
      setRole(roleMapping[storedRole] || 'Staff');
    }
  }, []);

  const handleLogout = () => {
    toast.success("Logout successful!");
    setTimeout(() => {
      localStorage.clear();
      navigate(`/`);
    }, 1700);
  };

  const handleSectionChange = (newSection) => {
    setSidebarOpen(false);
    if (newSection === 'pendingApprovals') {
      navigate('/staff/pending');
    } else if (newSection === 'processedApplications') {
      navigate('/staff/processed');
    }
  };
  
  // Navigation items are now defined in an array for clean rendering
  const navItems = [
    { id: 'pendingApprovals', label: 'Pending Applications', icon: <FiMail />, action: () => handleSectionChange('pendingApprovals') },
    { id: 'processedApplications', label: 'Processed Applications', icon: <FiCheckSquare />, action: () => handleSectionChange('processedApplications') },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'pendingApprovals':
        return <PendingApprovals />;
      case 'processedApplications':
        return <ProcessedApplications />;
      default:
        return <PendingApprovals />;
    }
  };
  
  const activeLabel = navItems.find(i => i.id === activeSection)?.label || "Dashboard";

  return (
    <div className="staff-dashboard-layout">
      <Toaster position="top-center" reverseOrder={false} />
      
      {isSidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

      <nav className={`sidebar-nav ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">{role}</h2>
          <button onClick={() => setSidebarOpen(false)} className="sidebar-close-button">
            <FiX />
          </button>
        </div>

        <ul className="sidebar-menu">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`sidebar-button ${activeSection === item.id ? 'active' : ''} ${item.className || ''}`}
                onClick={item.action}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <button className="sidebar-button logout-nav-item" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="mobile-header">
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-toggle">
            <FiMenu />
          </button>
          <h1 className="mobile-header-title">{activeLabel}</h1>
        </header>

        <div className="content-area">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default StaffDashboard;