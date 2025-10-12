import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";

import ProfilePage from '../../Components/ProfilePage/ProfilePage.jsx'; 
import EventForm from '../../Components/EventForm/EventForm.jsx';
import EventDashboard from '../../Components/StudentDashboard/EventDashboard.jsx'; 

import { FiGrid, FiUser, FiPlusSquare, FiLogOut, FiX, FiMenu } from 'react-icons/fi';
import './StudentDashboard.css';

function StudentDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Logout successful!");
    setTimeout(() => {
      localStorage.clear();
      navigate(`/`);
    }, 1700);
  };

  const handleSectionChange = (newSection) => {
    setActiveSection(newSection);
    setSidebarOpen(false);
  };
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiGrid />, action: () => handleSectionChange('dashboard') },
    { id: 'profile', label: 'Profile', icon: <FiUser />, action: () => handleSectionChange('profile') },
    { id: 'eventForm', label: 'Submit Event Proposal', icon: <FiPlusSquare />, action: () => handleSectionChange('eventForm') },
    { id: 'logout', label: 'Logout', icon: <FiLogOut />, action: handleLogout, className: 'logout-nav-item' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <EventDashboard />;
      case 'profile':
        return <ProfilePage />;
      case 'eventForm':
        return <EventForm />;
      default:
        return <EventDashboard />;
    }
  };
  
  const activeLabel = navItems.find(i => i.id === activeSection)?.label || "Dashboard";

  return (
    <div className="student-dashboard-layout">
      <Toaster position="top-center" reverseOrder={false} />
      
      {isSidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

      <nav className={`sidebar-nav ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Club Secretary</h2>
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

export default StudentDashboard;