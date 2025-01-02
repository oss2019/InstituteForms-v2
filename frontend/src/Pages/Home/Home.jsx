import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Home.css";
import collegeLogo from "/IITDHlogo.webp";
import clubSecretaryIcon from "/student.png";
import staffIcon from "/staff.png";
import Footer from "../../Components/Footer/Footer";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { googleAuth } from "./api";
import { GoogleLogin } from "@react-oauth/google";

const Home = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    let userData = isSignup
      ? { email, password, category: selectedCategory || "" }
      : { email, password };

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
      setTimeout(() => navigate(`/${selectedRole}`), 1000);
    } catch (error) {
      if (error.response) {
        console.log(error);
        toast.error("Error: " + error.response.data.message);
      }
    }
  };

  const responseGoogle = async (authResult) => {
    try {
      if (authResult?.credential) {
        // Send the JWT to the backend
        const result = await axios.post("http://localhost:4001/user/google-login", {
          token: authResult.credential,
        });
  
        const { email, name, image, role } = result.data.user;
        const token = result.data.token;
  
        if (role !== selectedRole) {
          toast.error("Not authorized for this role.");
          return;
        }
  
        const obj = { email, name, token, image };
        localStorage.setItem("user-info", JSON.stringify(obj));
        localStorage.setItem("token", obj.token);
  
        toast.success("Google Login successful!");
        setTimeout(() => navigate(`/${selectedRole}`), 1000);
      } else {
        throw new Error("Invalid Google Auth response");
      }
    } catch (e) {
      console.error("Error during Google Login:", e);
      toast.error("Google Login failed. Please try again.");
    }
  };
  

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  const googleLoginWrapper = () => {
    if (!selectedRole) {
      toast.error("Please select a role before logging in.");
      return;
    }
    googleLogin();
  };

  const handleIconClick = (role) => {
    if (selectedRole === role) {
      setIsExpanded(!isExpanded);
    } else {
      setSelectedRole(role);
      setIsExpanded(true);
    }
  };

  const toggleForm = (e) => {
    e.stopPropagation();
    if (selectedRole === "club-secretary") {
      setIsSignup((prev) => !prev);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const closeSignupForm = (e) => {
    if (!e.target.closest(".form-container")) {
      setIsSignup(false);
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
              className={`role-icon ${
                isExpanded && selectedRole === role ? "expand" : ""
              } ${isSignup && selectedRole === role ? "signup" : ""}`}
              onClick={() => handleIconClick(role)}
            >
              {selectedRole !== role && (
                <img
                  src={
                    role === "club-secretary" ? clubSecretaryIcon : staffIcon
                  }
                  alt={`${role} Icon`}
                  className="role-icon-image"
                />
              )}
              {isExpanded && selectedRole === role && (
                <div
                  className="form-container"
                  onClick={(e) => e.stopPropagation()}
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
                      onError={responseGoogle}
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