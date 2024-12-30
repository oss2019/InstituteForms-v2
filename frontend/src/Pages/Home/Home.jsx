import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Home.css";
import collegeLogo from "/IITDHlogo.webp";
import clubSecretaryIcon from "../../../public/student.png";
import staffIcon from "../../../public/staff.png";
import Footer from "../../Components/Footer/Footer";
import axios from "axios";

const Home = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // New state for category selection
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Prepare the user data
    const userData = {
      email: isSignup ? e.target[1].value : e.target[0].value, // Email for all roles
      password: e.target[isSignup ? 2 : 1].value, // Password
      category: selectedCategory, // Add the selected category to the user data
    };

    try {
      const response = await axios.post(
        `http://localhost:4001/user/${isSignup ? "signup" : "login"}`,
        userData
      );

      if (response.data.user.role !== selectedRole) {
        toast.error("Not Authorized for Login");
        return;
      }
      toast.success("Login successful!");
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userID", response.data.user._id);
      setTimeout(() => {
        navigate(`/${selectedRole}`);
      }, 1000);
    } catch (error) {
      if (error.response) {
        console.log(error);
        toast.error("Error: " + error.response.data.message);
      }
    }
  };

  const handleIconClick = (role) => {
    if (selectedRole === role) {
      setIsExpanded(!isExpanded); // Toggle expanded state only for selected role
    } else {
      setSelectedRole(role);
      setIsExpanded(true); // Expand the clicked role icon and hide the image
    }
  };

  const toggleForm = (e) => {
    e.stopPropagation();
    if (selectedRole === "club-secretary") {
      setIsSignup((prev) => !prev); // Only toggle signup for club-secretary role
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category); // Set the selected category
  };

  const closeSignupForm = (e) => {
    if (!e.target.closest(".form-container")) {
      setIsSignup(false); // Close signup form if clicked outside
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".expand")) {
        setIsExpanded(false);
        setSelectedRole(null);
      }
      closeSignupForm(e);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
              className={`role-icon ${isExpanded && selectedRole === role ? "expand" : ""} ${isSignup && selectedRole === role ? "signup" : ""}`}
              onClick={() => handleIconClick(role)}
            >
              {/* Conditionally render the icon only if the role is not selected */}
              {selectedRole !== role && (
                <img
                  src={role === "club-secretary" ? clubSecretaryIcon : staffIcon}
                  alt={`${role} Icon`}
                  className="role-icon-image"
                />
              )}
              {/* Show the form if the role is selected */}
              {isExpanded && selectedRole === role && (
                <div className="form-container" onClick={(e) => e.stopPropagation()}>
                  <form className="login-form" onSubmit={handleLogin}>
                    <h2 className="form-heading">
                      {isSignup
                        ? "Sign Up"
                        : role === "club-secretary"
                        ? "Club Secretary"
                        : role === "staff"
                        ? "Staff Portal"
                        : `${role.replace("-", " ").toUpperCase()} Login`}
                    </h2>
                    {isSignup && role === "club-secretary" && (
                      <div className="category-buttons">
                        {["Technical", "Cultural", "Sports", "Others"].map((category) => (
                          <button
                            key={category}
                            type="button"
                            className={`btn btn-sm ${selectedCategory === category ? "btn-success" : "btn-primary"}`}
                            onClick={() => handleCategoryClick(category)} // Handle category click
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      className="form-control form-control-sm"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      className="form-control form-control-sm"
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      {isSignup ? "Sign Up" : "Login"}
                    </button>
                    {role === "club-secretary" && (
                      <div className="toggle-container d-flex align-items-center mt-2">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="signupToggle"
                            checked={isSignup}
                            onChange={toggleForm}
                          />
                          <label htmlFor="signupToggle" className="form-check-label ml-2">
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
