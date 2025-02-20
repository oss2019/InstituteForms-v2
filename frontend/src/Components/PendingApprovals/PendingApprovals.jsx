import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./PendingApprovals.css"; // Import styles for leaves
import { Card, Button, Row, Col } from "react-bootstrap";

const PendingApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch pending approvals on mount
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      setLoading(true);
      try {
        const userRole = localStorage.getItem("role");
        const userCategory = localStorage.getItem("category");

        const pendingResponse = await axios.post("http://localhost:4001/event/pending", {
          role: userRole,
          category: userRole === "general-secretary" ? userCategory : null,
        });

        console.log("Pending Approvals: ", pendingResponse.data);
        setPendingApprovals(pendingResponse.data);
      } catch (error) {
        console.error("Error fetching pending approvals:", error);
        setError("Failed to fetch pending approvals.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  const handleStatusUpdate = async (applicationId, role, status) => {
    try {
      console.log("Sending request with:", { applicationId, role, status }); // Debug log
      const response = await axios.patch(
        `http://localhost:4001/event/${applicationId}/status`,
        {applicationId, role, status }
      );
      console.log("Response received:", response.data); // Debug log
      setPendingApprovals((prev) =>
        prev.filter((approval) => approval._id !== applicationId)
      );
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status. Please try again.");
    }
  };
  
  const handleViewDetails = (eventId) => {
    navigate(`/event-details/${eventId}`);
  };

  return (
    <div className="list-of-leaves">
      <h2>Pending Event Applications</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <Row>
          {pendingApprovals.map((approval) => (
            <Col md={6} key={approval._id}>
              <Card className="dashboard-card mb-4">
                <Card.Body>
                  <Card.Title>{`${approval.eventType} Event` || "Unknown Event"}</Card.Title>
                  <Card.Text>
                    <strong>Organizer:</strong> {approval.nameOfTheOrganizer || "Unknown Organizer"} <br />
                    <strong>Email:</strong> {approval.email || "No Email Provided"} <br />
                    <strong>Event Name:</strong> {approval.eventName} <br />
                    <strong>Venue:</strong> {approval.eventVenue || "Venue not specified"} <br />
                    <strong>Date:</strong> {new Date(approval.startDate).toLocaleDateString()} - {new Date(approval.endDate).toLocaleDateString()} <br />
                    <strong>Status:</strong> {approval.approvals.find(app => app.role === "general-secretary")?.status || "Pending"}
                  </Card.Text>
                  <Button
                    className="mb-1"
                    variant="primary"
                    onClick={() => handleViewDetails(approval._id)}
                  >
                    View Details
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {pendingApprovals.length === 0 && !loading && (
            <p>No Pending Event Applications available.</p>
          )}
        </Row>
      )}
    </div>
  );
};

export default PendingApprovals;
