import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FiAlertCircle, FiList, FiLogOut, FiX, FiMenu } from "react-icons/fi";
import SecretaryView from "../../Components/WelfareComplaints/SecretaryView";
import "./WelfareStaffDashboard.css";

const ROLE_LABELS = {
  "mess-secretary":    "Mess Secretary",
  "canteen-secretary": "Canteen Secretary",
  "gen-sec-hostel":    "General Secretary - Hostel",
};

const WelfareStaffDashboard = () => {
  const [view, setView]               = useState("action"); // "action" | "all"
  const [isSidebarOpen, setSidebar]   = useState(false);
  const [role, setRole]               = useState("");
  const navigate                      = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("role") || "";
    setRole(stored);
  }, []);

  const handleLogout = () => {
    toast.success("Logged out successfully!");
    setTimeout(() => { localStorage.clear(); navigate("/"); }, 1500);
  };

  const switchView = (v) => {
    setView(v);
    setSidebar(false);
  };

  const navItems = [
    {
      id:      "action",
      label:   "Action Needed",
      icon:    <FiAlertCircle />,
      action:  () => switchView("action"),
    },
    {
      id:      "all",
      label:   "All Complaints",
      icon:    <FiList />,
      action:  () => switchView("all"),
    },
    {
      id:      "logout",
      label:   "Logout",
      icon:    <FiLogOut />,
      action:  handleLogout,
      danger:  true,
    },
  ];

  const roleDisplay = ROLE_LABELS[role] || "Welfare Staff";
  const headingMap  = {
    action: "Action Needed",
    all:    "All Complaints",
  };

  return (
    <div className="wsd-layout">
      <Toaster position="top-center" />

      {/* Overlay (mobile) */}
      {isSidebarOpen && (
        <div className="wsd-overlay" onClick={() => setSidebar(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <nav className={`wsd-sidebar ${isSidebarOpen ? "wsd-sidebar--open" : ""}`}>
        <div className="wsd-sidebar__header">
          <div>
            <div className="wsd-sidebar__role">{roleDisplay}</div>
            <div className="wsd-sidebar__sub">Welfare Complaint Portal</div>
          </div>
          <button
            className="wsd-sidebar__close"
            aria-label="Close sidebar"
            onClick={() => setSidebar(false)}
          >
            <FiX />
          </button>
        </div>

        <ul className="wsd-sidebar__menu">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`wsd-sidebar__btn ${view === item.id ? "wsd-sidebar__btn--active" : ""} ${item.danger ? "wsd-sidebar__btn--danger" : ""}`}
                onClick={item.action}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="wsd-main">
        {/* Mobile header */}
        <header className="wsd-mobile-header">
          <button
            className="wsd-hamburger"
            aria-label="Open menu"
            onClick={() => setSidebar(true)}
          >
            <FiMenu />
          </button>
          <h2 className="wsd-mobile-title">{headingMap[view]}</h2>
        </header>

        <div className="wsd-content">
          <div className="wsd-content__heading">
            <h1>{headingMap[view]}</h1>
            <p>
              {view === "action"
                ? "Complaints waiting for your review and action."
                : "All complaints routed through your role, in any state."}
            </p>
          </div>

          {role ? (
            <SecretaryView role={role} view={view} />
          ) : (
            <div style={{ color: "#8da0bb", padding: "2rem" }}>
              Loading role information…
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WelfareStaffDashboard;
