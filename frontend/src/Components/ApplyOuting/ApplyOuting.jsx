import React, { useState } from 'react';
import axios from 'axios';
import './ApplyOuting.css'; // Import the CSS for styling
import toast, { Toaster } from "react-hot-toast";

function ApplyOuting() {
  const [outingData, setOutingData] = useState({
    placeOfVisit: '',
    reason: '',
    emergencyContact: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOutingData({ ...outingData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userID = localStorage.getItem('userID'); // Get userID from local storage
    try {
      await axios.post('http://localhost:4001/out/outapply', { ...outingData, userID }, { // Include userID in the request body
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Outing application submitted!'); // Use toast for success notification
      // Reset form data after submission
      setOutingData({
        placeOfVisit: '',
        reason: '',
        emergencyContact: ''
      });
    } catch (error) {
      console.error(error);
      toast.error("Error: " + error.response.data.message);
    }
  };

  return (
    <div className="outing-container">
      <Toaster /> {/* Add the Toaster component here */}
      <form onSubmit={handleSubmit} className="outing-form">
        <h2 className="form-title">Apply for Outing</h2>
        <input 
          name="placeOfVisit" 
          onChange={handleChange} 
          placeholder="Place of Visit" 
          required 
          className="form-input"
        />
        <input 
          name="reason" 
          onChange={handleChange} 
          placeholder="Reason" 
          required 
          className="form-input"
        />
        <input 
          name="emergencyContact" 
          onChange={handleChange} 
          placeholder="Emergency Contact" 
          required 
          className="form-input"
        />
        <button type="submit" className="form-button">Submit</button>
      </form>
    </div>
  );
}

export default ApplyOuting;
