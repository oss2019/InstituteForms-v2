import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS
import "./Home.css";
import collegeLogo from "/IITDHlogo.webp";
import Footer from "../../Components/Footer/Footer";
import axios from "axios";

const Home = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  //FrontendStarts
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userData =
        selectedRole === "security"
          ? { email:"security1@iitdh.ac.in",
            password: e.target[0].value,
            rollNumber:"123",
            role:"security"
           } // Only password for security
          : {
              email: isSignup ? e.target[1].value : e.target[0].value, // Roll No / Email for student/warden
              password: e.target[isSignup ? 2 : 1].value, // Password
              rollNumber: isSignup ? e.target[0].value : undefined, // Roll number for signup
            };

      const response = await axios.post(
        `http://localhost:4001/user/${isSignup ? 'signup' : 'login'}`,
        userData
      );
      console.log(response)
      if (response.data.user.role !== selectedRole) {
        toast.error("Not Authorized for Login");
        return;
      }
      toast.success("Login successful!");
      // Store necessary data in local storage
      
      localStorage.setItem("token", response.data.token); // Replace with your actual token path

      localStorage.setItem("userID", response.data.user._id); // or whatever response structure you have
    
    setTimeout(()=>{
      navigate(`/${selectedRole}`);
    },1000);
    } catch (error) {
      if (error.response) {
        console.log(error);
        toast.error("Error: " + error.response.data.message);
        setTimeout(() => {}, 1000);
      }
    }
  };

  const handleIconClick = (role) => {
    setSelectedRole(role);
    setIsExpanded(true);
    setIsSignup(false); // Reset to login mode on icon click
  };

  const toggleForm = (e) => {
    e.stopPropagation(); // Prevent click from affecting other elements
    setIsSignup((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".expand")) {
        setIsExpanded(false);
        setSelectedRole(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  //Frontend Ends
  return (
    <>
      <div className="login-page">
        <Toaster />
        <div className="logo-container">
          <img src={collegeLogo} alt="College Logo" className="college-logo" />
        </div>
        <div className="icon-container">
          {["student", "warden", "security"].map((role) => (
            <div
              key={role}
              className={`role-icon ${
                isExpanded && selectedRole === role ? "expand" : ""
              }`}
              onClick={() => handleIconClick(role)}
            >
              {!(isExpanded && selectedRole === role) &&
                (role === "student" ? "🎓" : role === "warden" ? "👨‍🏫" : "🛂")}
              {isExpanded && selectedRole === role && (
                <div
                  className="form-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <form className="login-form" onSubmit={handleLogin}>
                    <h2
                      className={`form-heading ${
                        role === "student" ? "student-heading" : ""
                      }`}
                    >
                      {isSignup
                        ? "Sign Up"
                        : `${
                            role.charAt(0).toUpperCase() + role.slice(1)
                          } Login`}
                    </h2>
                    {selectedRole !== "security" && (
                      <>
                        {isSignup && (
                          <input
                            type="text"
                            placeholder="Roll Number" // Placeholder for Roll Number
                            required
                            className="form-control form-control-sm"
                          />
                        )}

                        <input
                          type="email" // Change the type to email for better validation
                          placeholder="Email" // Placeholder for Email
                          required
                          className="form-control form-control-sm"
                        />
                      </>
                    )}

                    {/* Password field always shown */}
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      className="form-control form-control-sm"
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      {isSignup ? "Sign Up" : "Login"}
                    </button>

                    {role === "student" && (
                      <div className="toggle-container d-flex align-items-center mt-2">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="signupToggle"
                            checked={isSignup}
                            onChange={toggleForm}
                          />
                          <label
                            htmlFor="signupToggle"
                            className="form-check-label ml-2"
                          >
                            {isSignup ? "Login" : "Sign Up"}
                          </label>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
