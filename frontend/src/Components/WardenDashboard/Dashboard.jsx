import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import { Card, Container, Row, Col, Button } from 'react-bootstrap';

const WardenDashboard = () => {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllLeaveApplications = async () => {
      try {
        const response = await axios.get('http://localhost:4001/leave/all');
        // Only display pending applications initially
        setLeaveApplications(response.data.filter(app => app.status === 'Pending'));
      } catch (error) {
        console.error("Error fetching leave applications:", error);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllLeaveApplications();
  }, []);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await axios.put(`http://localhost:4001/leave/update/${applicationId}`, { status: newStatus });
      // Filter out applications that are no longer pending
      setLeaveApplications(prevApplications => 
        prevApplications.filter(app => app._id !== applicationId)
      );
    } catch (error) {
      console.error("Error updating application status:", error);
      setError("Failed to update status. Please try again.");
    }
  };

  return (
    <Container className="dashboard-container">
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <Row>
          {leaveApplications.map((application) => (
            <Col md={6} key={application._id}>
              <Card className="dashboard-card mb-4">
                <Card.Body>
                  <Card.Title>{application.userID.name || 'Unknown Student'}</Card.Title>
                  <Card.Text>
                    <strong>Roll Number:</strong> {application.userID.rollNumber} <br />
                    <strong>Email:</strong> {application.userID.email} <br />
                    <strong>Place of Visit:</strong> {application.placeOfVisit} <br />
                    <strong>Reason:</strong> {application.reason} <br />
                    <strong>Date of Leaving:</strong> {new Date(application.dateOfLeaving).toLocaleDateString()} <br />
                    <strong>Arrival Date:</strong> {new Date(application.arrivalDate).toLocaleDateString()} <br />
                    <strong>Emergency Contact:</strong> {application.emergencyContact} <br />
                    <strong>Status:</strong> {application.status}
                  </Card.Text>
                  <Button
                    variant="success"
                    onClick={() => handleStatusUpdate(application._id, 'Approved')}
                    disabled={application.status !== 'Pending'}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleStatusUpdate(application._id, 'Rejected')}
                    disabled={application.status !== 'Pending'}
                    className="ml-2"
                  >
                    Reject
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {leaveApplications.length === 0 && !loading && (
            <p>No pending leave applications available.</p>
          )}
        </Row>
      )}
    </Container>
  );
};

export default WardenDashboard;
