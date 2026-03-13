import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import collegeLogo from "/IITDHlogo.webp";
import "./StudentNavbar.css";

const StudentNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user-info") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const links = [
    { to: "/student",                      label: "Dashboard",          end: true },
    { to: "/student/mess",                 label: "Mess Complaint" },
    { to: "/student/canteen",              label: "Canteen Complaint" },
    { to: "/student/hostel",               label: "Hostel Complaint" },
    { to: "/student/accommodation-booking",label: "Accommodation Booking" },
    { to: "/student/my-complaints",        label: "My Complaints" },
  ];

  return (
    <nav className="student-nav">
      {/* Brand */}
      <NavLink to="/student" className="student-nav__brand">
        <img src={collegeLogo} alt="IIT Dharwad" className="student-nav__brand-logo" />
        <div className="student-nav__brand-text">
          <strong>IIT Dharwad</strong>
          <span>Student Welfare Portal</span>
        </div>
      </NavLink>

      {/* Hamburger */}
      <button
        className="student-nav__hamburger"
        aria-label="Toggle menu"
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Links */}
      <ul className={`student-nav__links ${menuOpen ? "nav-open" : ""}`}>
        {links.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? "nav-active" : "")}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          </li>
        ))}

        <li>
          <span style={{ fontSize: ".78rem", color: "#8da0bb", padding: "0 .5rem" }}>
            {user.name || user.email?.split("@")[0]}
          </span>
        </li>

        <li>
          <button className="nav-logout" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default StudentNavbar;
