import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";


import PendingApprovals from '../../Components/PendingApprovals/PendingApprovals';
import ProcessedApplications from '../../Components/StaffDashboard/ProcessedEventApplications'; 

import { FiMail, FiCheckSquare, FiLogOut, FiX, FiMenu, FiAlertCircle, FiList, FiEye } from 'react-icons/fi';
import SecretaryView from '../../Components/WelfareComplaints/SecretaryView';
import SWOWelfareView from '../../Components/WelfareComplaints/SWOWelfareView';
import AccommodationBookingWorkflowView from '../../Components/AccommodationBooking/AccommodationBookingWorkflowView';

import './StaffDashboard.css';

// Roles that have welfare action (escalation) access
const WELFARE_ACTION_ROLES = ['fic-mess-canteen', 'hostel-manager', 'warden', 'associate-dean', 'adean-hostel'];
// Roles that only see read-only welfare/fine view
const WELFARE_SWO_ROLES    = ['sw-office'];
// Roles that have event approval access
const EVENT_ROLES = ['general-secretary', 'treasurer', 'president', 'ARSW', 'associate-dean', 'dean'];
// Roles that have accommodation booking approval access
const ACCOMMODATION_BOOKING_ROLES = ['transit-facility', 'associate-dean', 'dean'];

function StaffDashboard() {
  const rawRole = localStorage.getItem('role') || '';
  const isEventRole   = EVENT_ROLES.includes(rawRole);
  const isBookingRole = ACCOMMODATION_BOOKING_ROLES.includes(rawRole);
  const defaultSection = isEventRole ? 'pendingApprovals'
    : isBookingRole ? 'bookingAction'
    : WELFARE_ACTION_ROLES.includes(rawRole) ? 'welfareAction'
    : 'welfareSWO';

  const [activeSection, setActiveSection] = useState(defaultSection);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState('Staff');
  const navigate = useNavigate();

  // Fetches the user's role from localStorage on component mount
  useEffect(() => {
    const roleMapping = {
      'general-secretary'  : 'General Secretary',
      'treasurer'          : 'Treasurer',
      'president'          : 'President',
      'ARSW'               : 'ARSW',
      'associate-dean'     : 'Associate Dean',
      'dean'               : 'Dean',
      'fic-mess-canteen'   : 'FIC – Mess & Canteen',
      'hostel-manager'     : 'Hostel Manager',
      'warden'             : 'Warden',
      'adean-hostel'       : 'ADean Hostel',
      'transit-facility'   : 'Transit Facility',
      'sw-office'          : 'SW Office',
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
    setActiveSection(newSection);
    setSidebarOpen(false);
  };
  
  // Build nav items conditionally based on stored role
  const isWelfareActionRole = WELFARE_ACTION_ROLES.includes(rawRole);
  const isSWORole           = WELFARE_SWO_ROLES.includes(rawRole);

  const navItems = [
    // ── Event sections (only for event-approval roles) ──────────────────────
    ...(isEventRole ? [
      { id: 'pendingApprovals',      label: 'Pending Applications',   icon: <FiMail />,        action: () => handleSectionChange('pendingApprovals') },
      { id: 'processedApplications', label: 'Processed Applications', icon: <FiCheckSquare />, action: () => handleSectionChange('processedApplications') },
    ] : []),
    // ── Welfare sections (FIC, associate-dean) ──────────────────────────────
    ...(isWelfareActionRole ? [
      { id: 'welfareDivider', isDivider: true, label: 'Welfare Complaints' },
      { id: 'welfareAction', label: 'Action Needed',   icon: <FiAlertCircle />, action: () => handleSectionChange('welfareAction') },
      { id: 'welfareAll',    label: 'All Complaints',  icon: <FiList />,        action: () => handleSectionChange('welfareAll') },
    ] : []),
    ...(isBookingRole ? [
      { id: 'bookingDivider', isDivider: true, label: 'Accommodation Booking' },
      { id: 'bookingAction', label: 'Booking Action Needed', icon: <FiAlertCircle />, action: () => handleSectionChange('bookingAction') },
      { id: 'bookingAll', label: 'All Booking Requests', icon: <FiList />, action: () => handleSectionChange('bookingAll') },
    ] : []),
    // ── SW Office read-only view ────────────────────────────────────────────
    ...(isSWORole ? [
      { id: 'welfareSWO', label: 'Welfare Complaints', icon: <FiEye />, action: () => handleSectionChange('welfareSWO') },
    ] : []),
    // ── Logout (always last) ────────────────────────────────────────────────
    { id: 'logout', label: 'Logout', icon: <FiLogOut />, action: handleLogout, className: 'logout-nav-item' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'pendingApprovals':
        return <PendingApprovals />;
      case 'processedApplications':
        return <ProcessedApplications />;
      case 'welfareAction':
        return <SecretaryView role={rawRole} view="action" />;
      case 'welfareAll':
        return <SecretaryView role={rawRole} view="all" />;
      case 'bookingAction':
        return <AccommodationBookingWorkflowView role={rawRole} view="action" />;
      case 'bookingAll':
        return <AccommodationBookingWorkflowView role={rawRole} view="all" />;
      case 'welfareSWO':
        return <SWOWelfareView />;
      default:
        return isEventRole
          ? <PendingApprovals />
          : isBookingRole
            ? <AccommodationBookingWorkflowView role={rawRole} view="action" />
            : isWelfareActionRole
              ? <SecretaryView role={rawRole} view="action" />
              : <SWOWelfareView />;
    }
  };
  
  const activeLabel = navItems.find(i => !i.isDivider && i.id === activeSection)?.label || "Dashboard";

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
          {navItems.map((item) => {
            if (item.isDivider) {
              return (
                <li key={item.id}>
                  <div className="sidebar-section-divider">{item.label}</div>
                </li>
              );
            }
            return (
              <li key={item.id}>
                <button
                  className={`sidebar-button ${activeSection === item.id ? 'active' : ''} ${item.className || ''}`}
                  onClick={item.action}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
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

export default StaffDashboard;