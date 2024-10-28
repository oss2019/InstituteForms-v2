import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [upcomingLeave, setUpcomingLeave] = useState(null);
  const [upcomingOuting, setUpcomingOuting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveStatus = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const leavesResponse = await axios.post(`http://localhost:4001/leave/status`, {
          userID: userId 
        });
        // Set leave application if response is valid
        setUpcomingLeave(leavesResponse.data);
      } catch (error) {
        console.error("Leave error:", error.response?.data || error.message);
        // Set to null if leave application is not found
        setUpcomingLeave(null);
      }
    };

    const fetchOutingStatus = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const outingsResponse = await axios.post(`http://localhost:4001/out/status`, {
          userID: userId 
        });
        // Set outing application if response is valid
        setUpcomingOuting(outingsResponse.data.outingRequest);
      } catch (error) {
        console.error("Outing error:", error.response.data || error.message);
        // Set to null if outing application is not found
        setUpcomingOuting(null);
      }
    };

    // Fetch both statuses
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchLeaveStatus(), fetchOutingStatus()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="section">
            <h2>Upcoming Leave</h2>
            <div className="card-container">
              {upcomingLeave ? (
                <div className="card">
                  <h3>Place of Visit: {upcomingLeave.placeOfVisit}</h3>
                  <p>Reason: {upcomingLeave.reason}</p>
                  <p>Date of Leaving: {new Date(upcomingLeave.dateOfLeaving).toLocaleDateString()}</p>
                  <p>Arrival Date: {new Date(upcomingLeave.arrivalDate).toLocaleDateString()}</p>
                  <p>Emergency Contact: {upcomingLeave.emergencyContact}</p>
                  <p>Status: {upcomingLeave.status}</p>
                </div>
              ) : (
                <p>No upcoming leave applications found.</p>
              )}
            </div>
          </div>

          <div className="section">
            <h2>Upcoming Outing</h2>
            <div className="card-container">
              {upcomingOuting ? (
                <div className="card">
                  <h3>Place of Visit: {upcomingOuting.placeOfVisit}</h3>
                  <p>Reason: {upcomingOuting.reason}</p>
                  <p>Outing Time: {new Date(upcomingOuting.outTime).toLocaleDateString()}</p>
                  <p>Emergency Contact: {upcomingOuting.emergencyContact}</p>
                  <p>Status: {upcomingOuting.status}</p>
                </div>
              ) : (
                <p>No upcoming outing applications found.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
