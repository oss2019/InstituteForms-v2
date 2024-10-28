import React, { useState } from 'react';
import axios from 'axios';
import './ApplyLeave.css';
import toast, { Toaster } from "react-hot-toast";

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

  // Get today’s date in YYYY-MM-DD format for validation
  const today = new Date().toISOString().split('T')[0];

  const handleDateValidation = () => {
    const { dateOfLeaving, arrivalDate } = formData;

    // Validate that dateOfLeaving is not in the past
    if (dateOfLeaving && new Date(dateOfLeaving) < new Date(today)) {
      toast.error("Date of leaving cannot be in the past.");
      setFormData({ ...formData, dateOfLeaving: '' });
      return;
    }

    // Validate that arrivalDate is not before dateOfLeaving
    if (arrivalDate && dateOfLeaving && new Date(arrivalDate) < new Date(dateOfLeaving)) {
      toast.error("Arrival date cannot be before the date of leaving.");
      setFormData({ ...formData, arrivalDate: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userID = localStorage.getItem('userID');
    try {
      await axios.post('http://localhost:4001/leave/apply', { ...formData, userID }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Leave application submitted!');
      setFormData({
        placeOfVisit: '',
        reason: '',
        dateOfLeaving: '',
        arrivalDate: '',
        emergencyContact: ''
      });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error applying for leave.');
    }
  };

  return (
    <div className="leave-container">
      <Toaster />
      <form onSubmit={handleSubmit} className="leave-form">
        <h2 className="form-title">Apply for Leave</h2>
        <input 
          name="placeOfVisit" 
          onChange={handleChange} 
          value={formData.placeOfVisit}
          placeholder="Place of Visit" 
          required 
          className="form-input"
        />
        <input 
          name="reason" 
          onChange={handleChange} 
          value={formData.reason}
          placeholder="Reason" 
          required 
          className="form-input"
        />

        {/* Label and Date Input for Date of Leaving with Minimum Date */}
        <label className="form-label">Date of Leave</label>
        <input 
          type="date" 
          name="dateOfLeaving" 
          onChange={handleChange} 
          onBlur={handleDateValidation}
          value={formData.dateOfLeaving}
          min={today} // Prevents selecting a past date
          required 
          className="form-input"
        />

        {/* Label and Date Input for Arrival Date with Validation */}
        <label className="form-label">Arrival Date</label>
        <input 
          type="date" 
          name="arrivalDate" 
          onChange={handleChange} 
          onBlur={handleDateValidation} // Validate on blur
          value={formData.arrivalDate}
          required 
          className="form-input"
        />

        <input 
          name="emergencyContact" 
          onChange={handleChange} 
          value={formData.emergencyContact}
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
