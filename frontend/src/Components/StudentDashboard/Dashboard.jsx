import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [upcomingLeave, setUpcomingLeave] = useState(null); // Single leave application
  const [upcomingOuting, setUpcomingOuting] = useState(null); // Single outing application
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeavesAndOutings = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const leavesResponse = await axios.post(`http://localhost:4001/leave/status`, { userID: userId });
        console.log("Leaves Response:", leavesResponse.data); // Log leaves response

        const outingsResponse = await axios.post(`http://localhost:4001/out/status`, { userID: userId });
        console.log("Outings Response:", outingsResponse.data.outingRequest); // Log outings response

        // Set the single upcoming leave if it exists
        if (leavesResponse.data) {
          setUpcomingLeave(leavesResponse.data); // Set leave application
        } else {
          setUpcomingLeave(null);
        }

        // Set the single upcoming outing if it exists
        if (outingsResponse.data.outingRequest) {
          setUpcomingOuting(outingsResponse.data.outingRequest); // Set outing application
        } else {
          setUpcomingOuting(null);
        }

      } catch (error) {
        console.error("Error fetching leaves and outings:", error);
        setError("You don't have a Leave or Outing Application.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeavesAndOutings();
  }, []);

  return (
    <div className="dashboard-container">
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          <div className="section">
            <h2>Upcoming Leaves</h2>
            <div className="card-container">
              {upcomingLeave ? (
                <div className="card">
                  <h3>{upcomingLeave.placeOfVisit}</h3>
                  <p>Reason: {upcomingLeave.reason}</p>
                  <p>Leaving on: {new Date(upcomingLeave.dateOfLeaving).toLocaleDateString()}</p>
                  <p>Leave Status: {upcomingLeave.status}</p>
                </div>
              ) : (
                <p>No upcoming leave applications found.</p>
              )}
            </div>
          </div>

          <div className="section">
            <h2>Upcoming Outings</h2>
            <div className="card-container">
              
                <div className="card">
                  <h3>{upcomingOuting.placeOfVisit}</h3>
                  <p>Reason: {upcomingOuting.reason}</p>
                  <p>Outing at: {new Date(upcomingOuting.outTime).toLocaleDateString()}</p>
                </div>
              
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
