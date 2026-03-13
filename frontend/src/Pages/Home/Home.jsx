import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "./Home.css";
import collegeLogo from "/IITDHlogo.webp";
import clubSecretaryIcon from "/student.png";
import staffIcon from "/staff.png";
import Footer from "../../Components/Footer/Footer";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

const StudentSVG = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="role-icon-svg">
    <circle cx="32" cy="20" r="10" fill="#1e3a5f" />
    <path d="M10 52c0-12.15 9.85-22 22-22s22 9.85 22 22" fill="#c9a227" />
    <path d="M20 14h24l-2 8H22z" fill="#c9a227" opacity="0.9" />
    <rect x="30" y="6" width="4" height="8" rx="1" fill="#1e3a5f" opacity="0.7" />
  </svg>
);

const Home = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const leaveTimer = useRef(null);
  const navigate   = useNavigate();

  const API = import.meta.env.VITE_API_URL || "http://localhost:4001";

  const saveAndNavigate = (user, token, destination) => {
    toast.success("Login successful!");
    localStorage.setItem("user-info", JSON.stringify({ ...user, token }));
    localStorage.setItem("token",    token);
    localStorage.setItem("email",    user.email);
    localStorage.setItem("role",     user.role);
    localStorage.setItem("category", user.category || user.type || "");

    axios.post(`${API}/user/details`, { email: user.email })
      .then(r  => localStorage.setItem("userID", r.data._id))
      .catch(() => {});

    setTimeout(() => navigate(destination), 900);
  };

  const handleGoogleLogin = async (authResult) => {
    try {
      if (!authResult?.credential) throw new Error("No credential");
      const result = await axios.post(`${API}/user/google-login`, {
        token: authResult.credential,
      });
      const { user, token } = result.data;
      const staffRoles = ["president","treasurer","ARSW","associate-dean","general-secretary","dean","transit-facility","fic-mess-canteen","hostel-manager","warden","adean-hostel","sw-office"];
      const welfareSecretaryRoles = ["mess-secretary","canteen-secretary","gen-sec-hostel"];

      if (selectedRole === "staff" && staffRoles.includes(user.role)) {
        saveAndNavigate(user, token, "/staff");
      } else if (selectedRole === "club-secretary" && welfareSecretaryRoles.includes(user.role)) {
        saveAndNavigate(user, token, "/welfare-staff");
      } else if (user.role === selectedRole) {
        saveAndNavigate(user, token, `/${selectedRole}`);
      } else {
        toast.error("Not authorised for this portal.");
      }
    } catch {
      toast.error("Google login failed. Please try again.");
    }
  };

  const handleStudentGoogleLogin = async (authResult) => {
    try {
      if (!authResult?.credential) throw new Error("No credential");
      const result = await axios.post(`${API}/user/student-google-login`, {
        token: authResult.credential,
      });
      const { user, token } = result.data;
      saveAndNavigate(user, token, "/student");
    } catch (e) {
      const msg = e.response?.data?.message || "Student login failed.";
      toast.error(msg);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await axios.post(`${API}/user/login`, { email, password });
      const { user, token } = result.data;
      const staffRoles = ["president","treasurer","ARSW","associate-dean","general-secretary","dean","transit-facility","fic-mess-canteen","hostel-manager","warden","adean-hostel","sw-office"];
      const welfareSecretaryRoles = ["mess-secretary","canteen-secretary","gen-sec-hostel"];
      if (selectedRole === "staff" && staffRoles.includes(user.role)) {
        saveAndNavigate(user, token, "/staff");
      } else if (user.role === "club-secretary" && selectedRole === "club-secretary") {
        saveAndNavigate(user, token, "/club-secretary");
      } else if (selectedRole === "club-secretary" && welfareSecretaryRoles.includes(user.role)) {
        saveAndNavigate(user, token, "/welfare-staff");
      } else {
        toast.error("Not authorised for this portal.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check credentials.");
    }
  };

  const handleMouseEnter = (role) => {
    clearTimeout(leaveTimer.current);
    setSelectedRole(role);
    setEmail("");
    setPassword("");
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setSelectedRole(null), 220);
  };

  const cards = [
    {
      id:       "staff",
      label:    "Dean / HOD",
      sublabel: "Administrative Staff Portal",
      icon:     <img src={staffIcon} alt="Dean" className="role-icon-image" />,
      showForm: true,
    },
    {
      id:       "club-secretary",
      label:    "Authorities",
      sublabel: "Secretary / Club Officers",
      icon:     <img src={clubSecretaryIcon} alt="Secretary" className="role-icon-image" />,
      showForm: true,
    },
    {
      id:       "student",
      label:    "Student Portal",
      sublabel: "Sign in with College Account",
      icon:     <StudentSVG />,
      showForm: false,
    },
  ];

  return (
    <>
      <Toaster position="top-center" />
      <div className="home-page">
        <div className="home-branding">
          <img src={collegeLogo} alt="IIT Dharwad" className="home-logo" />
          <div className="home-branding-text">
            <h1 className="home-institute">IIT Dharwad</h1>
            <p className="home-tagline">Student Welfare &amp; Events Portal</p>
          </div>
        </div>

        <div className="home-cards-area">
          <p className="home-prompt">Select your portal to continue</p>
          <div className="home-cards-row">
            {cards.map((card) => {
              const active = selectedRole === card.id;
              return (
                <div
                  key={card.id}
                  className={`role-card ${card.id === "student" ? "role-card--student" : ""} ${active ? "role-card--active" : ""}`}
                  onMouseEnter={() => handleMouseEnter(card.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className={`card-face ${active ? "card-face--hidden" : ""}`}>
                    <div className="card-icon-wrap">{card.icon}</div>
                    <h3 className="card-label">{card.label}</h3>
                    <p className="card-sublabel">{card.sublabel}</p>
                    <span className="card-cta">Hover to login </span>
                  </div>

                  <div
                    className={`card-login ${active ? "card-login--visible" : ""}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="card-login-title">{card.label}</h3>
                    <p className="card-login-sub">{card.sublabel}</p>

                    {card.showForm ? (
                      <>
                        <form onSubmit={handleEmailLogin} className="login-form-inner">
                          <input
                            type="email"
                            placeholder="Institute Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="lf-input"
                          />
                          <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="lf-input"
                          />
                          <button type="submit" className="lf-btn lf-btn--primary">
                            Login
                          </button>
                        </form>
                        <div className="lf-divider"><span>or</span></div>
                        <div className="lf-google">
                          <GoogleLogin
                            onSuccess={handleGoogleLogin}
                            onError={() => toast.error("Google login failed")}
                            theme="outline"
                            text="signin_with"
                            shape="rectangular"
                            width="210"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="student-google-wrap">
                        <p className="student-hint">
                          Use your <strong>@iitdh.ac.in</strong> Google account.
                          <br />First-time? Your profile is created automatically.
                        </p>
                        <div className="lf-google">
                          <GoogleLogin
                            onSuccess={handleStudentGoogleLogin}
                            onError={() => toast.error("Google login failed")}
                            theme="filled_blue"
                            text="signin_with"
                            shape="rectangular"
                            width="210"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
