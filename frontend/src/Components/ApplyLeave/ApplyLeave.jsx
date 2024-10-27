import React, { useState } from 'react';
import axios from 'axios';
import './ApplyLeave.css';
import toast, { Toaster } from "react-hot-toast"; // Import toast and Toaster

function ApplyLeave() {
  const [formData, setFormData] = useState({
    placeOfVisit: '',
    reason: '',
    dateOfLeaving: '',
    arrivalDate: '',
    emergencyContact: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userID = localStorage.getItem('userID'); // Get userID from local storage
    try {
      await axios.post('http://localhost:4001/leave/apply', { ...formData, userID }, { // Include userID in the request body
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Leave application submitted!'); // Use toast for success notification
      setFormData({ // Reset form data after submission
        placeOfVisit: '',
        reason: '',
        dateOfLeaving: '',
        arrivalDate: '',
        emergencyContact: ''
      });
    } catch (error) {
      console.error(error);
      // Use toast for error notification
      toast.error(error.response?.data?.message || 'Error applying for leave.');
    }
  };

  return (
    <div className="leave-container">
      <Toaster /> {/* Add the Toaster component here */}
      <form onSubmit={handleSubmit} className="leave-form">
        <h2 className="form-title">Apply for Leave</h2>
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
          type="date" 
          name="dateOfLeaving" 
          onChange={handleChange} 
          required 
          className="form-input"
        />
        <input 
          type="date" 
          name="arrivalDate" 
          onChange={handleChange} 
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

export default ApplyLeave;
