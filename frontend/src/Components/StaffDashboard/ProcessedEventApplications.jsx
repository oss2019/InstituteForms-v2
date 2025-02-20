import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProcessedEventApplications.css';
import { Card, Container, Row, Col } from 'react-bootstrap';

const StaffDashboard = () => {
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [rejectedApplications, setRejectedApplications] = useState([]); // New state for rejected applications
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Approved applications:", approvedApplications);
  }, [approvedApplications]);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        // Retrieve user details from localStorage
        const userRole = localStorage.getItem("role");
        console.log("Role sent to API:", userRole);

        const userCategory = localStorage.getItem('category');

        // Fetch approved event applications
        const approvedResponse = await axios.post('http://localhost:4001/event/approved', {
          role: userRole,
          category: userRole === 'general-secretary' ? userCategory : null,
        });

        console.log("Approved Applications: ", approvedResponse.data);
        setApprovedApplications(approvedResponse.data);

        // Fetch rejected event applications
        const rejectedResponse = await axios.post('http://localhost:4001/event/rejected', {
          role: userRole,
          category: userRole === 'general-secretary' ? userCategory : null,
        });

        console.log("Rejected Applications: ", rejectedResponse.data);
        setRejectedApplications(rejectedResponse.data);

      } catch (error) {
        console.error('Error fetching applications:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <Container className="dashboard-container">
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          {/* Approved Event Applications Section */}
          <h2>Approved Event Applications</h2>
          <Row>
            {approvedApplications.map((application) => (
              <Col md={6} key={application._id}>
                <Card className="dashboard-card mb-4">
                  <Card.Body>
                    <Card.Title>{`${application.eventType} Event` || 'Unknown Event'}</Card.Title>
                    <Card.Text>
                      <strong>Organizer:</strong> {application.nameOfTheOrganizer || 'Unknown Organizer'} <br />
                      <strong>Email:</strong> {application.email || 'No Email Provided'} <br />
                      <strong>Event Name:</strong> {application.eventName} <br />
                      <strong>Venue:</strong> {application.eventVenue || 'Venue not specified'} <br />
                      <strong>Date:</strong> {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()} <br />
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

          {/* Rejected Event Applications Section */}
          <h2 className="mt-5">Rejected Event Applications</h2>
          <Row>
            {rejectedApplications.map((application) => (
              <Col md={6} key={application._id}>
                <Card className="dashboard-card mb-4">
                  <Card.Body>
                    <Card.Title>{`${application.eventType} Event` || 'Unknown Event'}</Card.Title>
                    <Card.Text>
                      <strong>Organizer:</strong> {application.nameOfTheOrganizer || 'Unknown Organizer'} <br />
                      <strong>Email:</strong> {application.email || 'No Email Provided'} <br />
                      <strong>Event Name:</strong> {application.eventName} <br />
                      <strong>Venue:</strong> {application.eventVenue || 'Venue not specified'} <br />
                      <strong>Date:</strong> {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()} <br />
                      <strong>Status:</strong> {application.approvals.find(app => app.role === 'general-secretary')?.status || 'Pending'}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {rejectedApplications.length === 0 && !loading && (
              <p>No rejected event applications available.</p>
            )}
          </Row>
        </>
      )}
    </Container>
  );
};

export default StaffDashboard;
