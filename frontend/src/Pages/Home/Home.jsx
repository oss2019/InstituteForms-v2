import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Home.css";
import collegeLogo from "/IITDHlogo.webp";
import clubSecretaryIcon from "/student.png";
import staffIcon from "/staff.png";
import Footer from "../../Components/Footer/Footer";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

const Home = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  // Note: The 'isSignup' logic might need adjustment with a pure hover interaction
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const responseGoogle = async (authResult) => {
    try {
      if (authResult?.credential) {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
        const result = await axios.post(`${apiUrl}/user/google-login`, {
          token: authResult.credential,
        });

        const { email, name, image, role, category } = result.data.user;
        const token = result.data.token;

        const allowedRolesForStaff = [
          "president", "treasurer", "faculty-in-charge", 
          "associate-dean", "general-secretary", "dean"
        ];

        const loginUser = (userRole) => {
            toast.success("Login successful!");
            localStorage.setItem("user-info", JSON.stringify({ email, name, token, image, role, category }));
            localStorage.setItem("token", token);
            localStorage.setItem("email", email);
            localStorage.setItem("role", role);
            localStorage.setItem("category", category);

            axios.post(`${apiUrl}/user/details`, { email: email })
              .then(response => {
                  localStorage.setItem("userID", response.data._id);
              })
              .catch(error => {
                  console.error("Error fetching user data:", error);
                  toast.error("Failed to load user data");
              });
              
            setTimeout(() => navigate(`/${userRole}`), 1000);
        };

        if (selectedRole === "staff" && allowedRolesForStaff.includes(role)) {
          loginUser("staff");
        } else if (role === selectedRole) {
          loginUser(selectedRole);
        } else {
          toast.error("Not authorized for this role.");
        }
      } else {
        throw new Error("Invalid Google Auth response");
      }
    } catch (e) {
      console.error("Error during Google Login:", e);
      toast.error("Google Login failed. Please try again.");
    }
  };

  // --- KEY CHANGES START HERE ---

  // 1. Create separate, clear handlers for mouse enter and mouse leave.
  const handleMouseEnter = (role) => {
    setSelectedRole(role);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setSelectedRole(null);
    setIsExpanded(false);
    setIsSignup(false); // Also reset signup state if needed
  };

  // 2. The useEffect for handling clicks outside is no longer needed for hover functionality.
  //    You can remove it to simplify the component.
  /*
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
  */
  
  // --- KEY CHANGES END HERE ---


  return (
    <>
      <div className="login-page">
        <Toaster />
        <div className="logo-container">
          <img src={collegeLogo} alt="College Logo" className="college-logo" />
        </div>
        <div className="icon-container">
          {["club-secretary", "staff"].map((role) => (
            <div
              key={role}
              // 3. Add onMouseLeave and update onMouseEnter to use the new handlers.
              onMouseEnter={() => handleMouseEnter(role)}
              onMouseLeave={handleMouseLeave}
              className={`role-icon ${
                isExpanded && selectedRole === role ? "expand" : ""
              } ${isSignup && selectedRole === role ? "signup" : ""}`}
            >
              {/* This logic now works correctly on hover */}
              {!isExpanded || selectedRole !== role ? (
                <img
                  src={
                    role === "club-secretary" ? clubSecretaryIcon : staffIcon
                  }
                  alt={`${role} Icon`}
                  className="role-icon-image"
                />
              ) : (
                <div
                  className="form-container"
                  onClick={(e) => e.stopPropagation()} // Prevents event bubbling
                >
                  <h2 className="form-heading">
                    {isSignup
                      ? "Sign Up"
                      : role === "club-secretary"
                      ? "Club Secretary"
                      : "Staff Portal"}
                  </h2>
                  <div className="toggle-container d-flex align-items-center mt-2">
                    <GoogleLogin
                      onSuccess={responseGoogle}
                      onError={() => toast.error("Login failed")}
                      theme="outline"
                      text="signin_with"
                      shape="square"
                    />
                  </div>
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