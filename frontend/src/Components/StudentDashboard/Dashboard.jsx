import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";
import { Card, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";


const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventStatus = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const response = await axios.post("http://localhost:4001/event/user-events", {
          userID: userId,
        });
        // Set events data if response is valid
        setEvents(response.data.events || []);
      } catch (error) {
        console.error("Error fetching events:", error.response?.data || error.message);
        setEvents([]); // Set to empty if no events are found
      } finally {
        setLoading(false);
      }
    };

    fetchEventStatus();
  }, []);

  const handleViewDetails = (eventId) => {
    navigate(`/event-details/${eventId}`);
  };

  return (
    <div className="dashboard-container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="section">
            <h2>My Event Applications</h2>
            <div className="card-container">
              {events.length > 0 ? (
                events.map((event) => {
                  const status = event.approvals.find(
                    (app) => app.role === "associate-dean"
                  )?.status || "Pending";

                  // Determine the class for the card based on status
                  const cardClass = status.toLowerCase();

                  return (
                    <div key={event._id} className={`card ${cardClass}`}>
                      <h3><b>Event Name:</b> {event.eventName}</h3>
                      <p><b>Club:</b> {event.clubName}</p>
                      <p><b>Venue:</b> {event.eventVenue}</p>
                      <p>
                        <b>Duration:</b> {new Date(event.startDate).toLocaleDateString()} to{" "}
                        {new Date(event.endDate).toLocaleDateString()}
                      </p>
                      <p><b>Status:</b> {status}</p>
                      <Button
                        className="mb-1"
                        variant="primary"
                        onClick={() => handleViewDetails(event._id)}
                      >
                        View Details
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p>No events found.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
