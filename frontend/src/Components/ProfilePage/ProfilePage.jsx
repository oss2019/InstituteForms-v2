import { useState, useEffect } from "react";
import axios from "axios";
import './ProfilePage.css'; // Import the CSS file for styling

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const userID = localStorage.getItem("userID");
      try {
        const response = await axios.post("http://localhost:4001/user/details", {
          userId: userID
        });
        setUserData(response.data);
        setFormData(response.data); // Set the initial form data to be displayed
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userID = localStorage.getItem("userID");
    try {
      // Send updated data to the backend
      await axios.put(`http://localhost:4001/user/edit`, { userId: userID, ...formData });
      setIsEditing(false);
      setUserData(formData); // Update the displayed data after editing
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Failed to update user data");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="profile-container">
      {error && <p className="error-message">{error}</p>}
      {userData ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <h2>Student Information</h2>
            <label htmlFor="name">Name:</label>
            {isEditing ? (
              <input 
                id="name"
                name="name" 
                value={formData.name || ""} 
                onChange={handleChange} 
                required 
              />
            ) : (
              <p>{userData.name || "N/A"}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="rollNumber">Roll Number:</label>
            {isEditing ? (
              <input 
                id="rollNumber"
                name="rollNumber" 
                value={formData.rollNumber || ""} 
                onChange={handleChange} 
                required 
              />
            ) : (
              <p>{userData.rollNumber}</p>
            )}
          </div>
          <div className="form-group">
            <label>Email:</label>
            <p>{userData.email}</p>
          </div>
          <div className="form-group">
            <label htmlFor="phnumber">Phone Number:</label>
            {isEditing ? (
              <input 
                id="phnumber"
                name="phnumber" 
                value={formData.phnumber || ""} 
                onChange={handleChange} 
                required 
              />
            ) : (
              <p>{userData.phnumber || "N/A"}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="hostel">Hostel:</label>
            {isEditing ? (
              <input 
                id="hostel"
                name="hostel" 
                value={formData.hostel || ""} 
                onChange={handleChange} 
                required 
              />
            ) : (
              <p>{userData.hostel || "N/A"}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="roomNumber">Room Number:</label>
            {isEditing ? (
              <input 
                id="roomNumber"
                name="roomNumber" 
                value={formData.roomNumber || ""} 
                onChange={handleChange} 
                required 
              />
            ) : (
              <p>{userData.roomNumber || "N/A"}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="branch">Branch:</label>
            {isEditing ? (
              <input 
                id="branch"
                name="branch" 
                value={formData.branch || ""} 
                onChange={handleChange} 
                required 
              />
            ) : (
              <p>{userData.branch || "N/A"}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="year">Year:</label>
            {isEditing ? (
              <input 
                id="year"
                name="year" 
                value={formData.year || ""} 
                onChange={handleChange} 
                required 
              />
            ) : (
              <p>{userData.year || "N/A"}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="course">Course:</label>
            {isEditing ? (
              <input 
                id="course"
                name="course" 
                value={formData.course || ""} 
                onChange={handleChange} 
                required 
              />
            ) : (
              <p>{userData.course || "N/A"}</p>
            )}
          </div>
          <button type="button" className="form-button" onClick={handleEditToggle}>
            {isEditing ? "Cancel" : "Edit"}
          </button>
          {isEditing && <button className="form-button" type="submit">Save</button>}
        </form>
      ) : (
        <p>Loading user data failed. Please try again later.</p>
      )}
    </div>
  );
};

export default ProfilePage;
