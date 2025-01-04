import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import { Card, Container, Row, Col } from 'react-bootstrap';

const StaffDashboard = () => {
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApprovals = async () => {
      setLoading(true);
      try {
        // Retrieve user details from localStorage
        const userRole = localStorage.getItem("role");
        const userCategory = localStorage.getItem('category');

        const approvedResponse = await axios.post('http://localhost:4001/event/approved', {
          role: userRole,
          category: userRole === 'general-secretary' ? userCategory : null,
        });

        console.log("Approved Applications: ", approvedResponse.data);

        setApprovedApplications(approvedResponse.data);
      } catch (error) {
        console.error('Error fetching approvals:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, []);

  return (
    <Container className="dashboard-container">
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          <h2>Approved Event Applications</h2>
          <Row>
            {approvedApplications.map((application) => (
              <Col md={6} key={application._id}>
                <Card className="dashboard-card mb-4">
                  <Card.Body>
                    <Card.Title>{application.eventCategory || 'Unknown Event'}</Card.Title>
                    <Card.Text>
                      <strong>Organizer:</strong> {application.name || 'Unknown Organizer'} <br />
                      <strong>Email:</strong> {application.email || 'No Email Provided'} <br />
                      <strong>Event Category:</strong> {application.eventCategory} <br />
                      <strong>Venue:</strong> {application.venue || 'Venue not specified'} <br />
                      <strong>Date:</strong> {new Date(application.dateFrom).toLocaleDateString()} - {new Date(application.dateTo).toLocaleDateString()} <br />
                      <strong>Status:</strong> {application.approvals.find(app => app.role === 'general-secretary')?.status || 'Pending'}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {approvedApplications.length === 0 && !loading && (
              <p>No approved event applications available.</p>
            )}
          </Row>
        </>
      )}
    </Container>
  );
};

export default StaffDashboard;
