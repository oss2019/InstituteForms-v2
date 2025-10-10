import { useState, useEffect } from "react";
import axios from "axios";
import './ProfilePage.css'; // Import the CSS file for styling

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Define categories for the dropdown
  const categories = ["Technical", "Cultural", "Sports", "Others"];

  useEffect(() => {
    const fetchUserData = async () => {
      const userID = localStorage.getItem("userID");
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
        const response = await axios.post(`${apiUrl}/user/details`, {
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
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      await axios.put(`${apiUrl}/user/edit`, { userId: userID, ...formData });
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
            <label htmlFor="category">Category:</label>
            {isEditing ? (
              <select 
                id="category" 
                name="category" 
                value={formData.category || ""} 
                onChange={handleChange} 
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            ) : (
              <p>{userData.category || "N/A"}</p>
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
