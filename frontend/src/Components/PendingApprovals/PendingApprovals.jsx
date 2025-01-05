import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PendingApprovals.css'; // Import styles for leaves
import { Card, Button, Row, Col } from 'react-bootstrap';

const ListOfLeaves = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      setLoading(true);
      try {
        const userRole = localStorage.getItem("role");
        const userCategory = localStorage.getItem('category');

        const pendingResponse = await axios.post('http://localhost:4001/event/pending', {
          role: userRole,
          category: userRole === 'general-secretary' ? userCategory : null,
        });

        console.log("Pending Approvals: ", pendingResponse.data);

        setPendingApprovals(pendingResponse.data);
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
        setError('Failed to fetch pending approvals.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  const handleStatusUpdate = async (applicationId, role, status) => {
    const userRole = localStorage.getItem("role");
    try {
      await axios.patch('http://localhost:4001/event/approve', {
        applicationId, // Send the applicationId in the request
        role: userRole, // Send the user role in the request
        status,
      });

      // Remove the updated application from pending approvals
      setPendingApprovals((prev) =>
        prev.filter((approval) => approval._id !== applicationId)
      );
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status. Please try again.');
    }
  };

  return (
    <div className="list-of-leaves">
      <h2>Pending Event Applications</h2>
      {loading ? (
        <p>Loading leaves...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <Row>
          {pendingApprovals.map((approval) => (
            <Col md={6} key={approval._id}>
              <Card className="dashboard-card mb-4">
                <Card.Body>
                  <Card.Title>{`${approval.eventType} Event` || 'Unknown Event'}</Card.Title>
                  <Card.Text>
                    <strong>Organizer:</strong> {approval.nameOfTheOrganizer || 'Unknown Organizer'} <br />
                    <strong>Email:</strong> {approval.email || 'No Email Provided'} <br />
                    <strong>Event Name:</strong> {approval.eventName} <br />
                    <strong>Venue:</strong> {approval.eventVenue || 'Venue not specified'} <br />
                    <strong>Date:</strong> {new Date(approval.startDate).toLocaleDateString()} - {new Date(approval.endDate).toLocaleDateString()} <br />
                    <strong>Status:</strong> {approval.approvals.find(app => app.role === 'general-secretary')?.status || 'Pending'}
                  </Card.Text>
                  <Button
                    variant="success"
                    onClick={() => handleStatusUpdate(approval._id, 'general-secretary', 'Approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleStatusUpdate(approval._id, 'general-secretary', 'Rejected')}
                    className="ml-2"
                  >
                    Reject
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

export default ListOfLeaves;
