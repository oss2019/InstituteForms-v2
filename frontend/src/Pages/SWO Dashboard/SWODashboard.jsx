import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";

import SWOEvents from '../../Components/SWODashboard/SWOEvents';

import { FiLogOut, FiX, FiMenu, FiGrid } from 'react-icons/fi';

import '../Staff Dashboard/StaffDashboard.css';

function SWODashboard() {
  const [activeSection, setActiveSection] = useState('swoEvents');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole !== 'students-welfare-office') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    toast.success("Logout successful!");
    setTimeout(() => {
      localStorage.clear();
      navigate('/');
    }, 1700);
  };

  const handleSectionChange = (newSection) => {
    setActiveSection(newSection);
    setSidebarOpen(false);
  };

  const navItems = [
    { id: 'swoEvents', label: 'Events', icon: <FiGrid />, action: () => handleSectionChange('swoEvents') },
    { id: 'logout', label: 'Logout', icon: <FiLogOut />, action: handleLogout, className: 'logout-nav-item' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'swoEvents':
        return <SWOEvents />;
      default:
        return <SWOEvents />;
    }
  };

  const activeLabel = navItems.find(i => i.id === activeSection)?.label || "Dashboard";

  return (
    <div className="staff-dashboard-layout">
      <Toaster position="top-center" reverseOrder={false} />

      {isSidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

      <nav className={`sidebar-nav ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">SW Office</h2>
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

export default SWODashboard;
