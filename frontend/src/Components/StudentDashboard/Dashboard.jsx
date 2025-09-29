//CLUB SECRETARY DASHBOARD
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Dashboard.css";
import { Card, Button, Row, Col, Form, InputGroup, Container, Accordion, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [events, setEvents] = useState([]);             // Raw events
  const [displayEvents, setDisplayEvents] = useState([]); // Filtered & sorted events
  const [groupedEvents, setGroupedEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const [eventTypeOptions, setEventTypeOptions] = useState([]);

  // Filter states
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Approved, Pending, Rejected, Query
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest | name-az | name-za

  // Debounce ref
  const searchDebounceRef = useRef(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventStatus = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
        const response = await axios.post(`${apiUrl}/event/user-events`, {
          userID: userId,
        });
        // Set events data if response is valid
        const eventsData = response.data.events || [];
        setEvents(eventsData);
        prepareFilterOptions(eventsData);
        setDisplayEvents(eventsData);
        groupEventsBySemester(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error.response?.data || error.message);
        setEvents([]); 
        setGroupedEvents({});
      } finally {
        setLoading(false);
      }
    };

    fetchEventStatus();
  }, []);

  // Prepare dropdown options from events
  const prepareFilterOptions = (eventsData) => {
    const semesters = Array.from(new Set(eventsData.map(e => e.semester).filter(Boolean))).sort();
    const academicYears = Array.from(new Set(eventsData.map(e => e.academicYear).filter(Boolean))).sort().reverse();
    const eventTypes = Array.from(new Set(eventsData.map(e => e.eventType).filter(Boolean))).sort();
    setSemesterOptions(semesters);
    setAcademicYearOptions(academicYears);
    setEventTypeOptions(eventTypes);
  };

  // Group events by semester for display
  const groupEventsBySemester = (eventsData) => {
    const grouped = eventsData.reduce((groups, event) => {
      const semesterKey = event.semester || `${event.academicYear || "Unknown Year"} Academic Year` || "Unspecified";
      if (!groups[semesterKey]) groups[semesterKey] = [];
      groups[semesterKey].push(event);
      return groups;
    }, {});
    setGroupedEvents(grouped);
  };

  // Apply all filters + search + sort
  const applyFilters = () => {
    let result = [...events];

    if (selectedSemester) result = result.filter(e => e.semester === selectedSemester);
    if (selectedAcademicYear) result = result.filter(e => e.academicYear === selectedAcademicYear);
    if (eventTypeFilter) result = result.filter(e => e.eventType === eventTypeFilter);
    if (statusFilter) {
      result = result.filter(e => {
        const status = getOverallStatus(e.approvals).toLowerCase();
        return status === statusFilter.toLowerCase();
      });
    }
    if (searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      result = result.filter(e => (
        e.eventName?.toLowerCase().includes(s) ||
        e.clubName?.toLowerCase().includes(s) ||
        e.eventVenue?.toLowerCase().includes(s) ||
        e.eventType?.toLowerCase().includes(s) ||
        e.semester?.toLowerCase().includes(s)
      ));
    }

    // Sorting
    switch (sortOrder) {
      case "oldest":
        result.sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
        break;
      case "name-az":
        result.sort((a,b) => a.eventName.localeCompare(b.eventName));
        break;
      case "name-za":
        result.sort((a,b) => b.eventName.localeCompare(a.eventName));
        break;
      default: // newest
        result.sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
    }

    setDisplayEvents(result);
    groupEventsBySemester(result);
  };

  // Debounce search + react to filters
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      applyFilters();
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedSemester, selectedAcademicYear, statusFilter, eventTypeFilter, sortOrder, events]);

  const handleReset = () => {
    setSelectedSemester("");
    setSelectedAcademicYear("");
    setStatusFilter("");
    setEventTypeFilter("");
    setSortOrder("newest");
    setSearchTerm("");
  };

  const handleViewDetails = (eventId) => {
    navigate(`/event-details/${eventId}`);
  };

  const getOverallStatus = (approvals) => {
    if (approvals.some((app) => app.status === "Rejected")) {
      return "Rejected";
    }
    else if(approvals.some((app) => app.status === "Query")) {
      return "Query";
    }
    else if (approvals.every((app) => app.status === "Approved")) {
      return "Approved";
    } else {
      return "Pending";
    }
  };

  const renderEventCard = (event) => (
    <div key={event._id} className={`card ${getOverallStatus(event.approvals).toLowerCase()}`}>
      <h3><b>Event Name:</b> {event.eventName}</h3>
      <p><b>Club:</b> {event.clubName}</p>
      <p><b>Venue:</b> {event.eventVenue}</p>
      <p>
        <b>Duration:</b> {new Date(event.startDate).toLocaleDateString()} to{" "}
        {new Date(event.endDate).toLocaleDateString()}
      </p>
      <p><b>Semester:</b> {event.semester || 'Not specified'}</p>
      <p><b>Status:</b> {getOverallStatus(event.approvals)}</p>
      <div className="view-details-button">
        <Button
          className="mb-1"
          variant="primary"
          onClick={() => handleViewDetails(event._id)}
        >
          View Details
        </Button>
      </div>
    </div>
  );

  return (
    <Container className="dashboard-container">
      <h2 className="mb-3">My Event Applications</h2>
      <div className="filters-section p-3 mb-4">
        <Form>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Semester</Form.Label>
                <Form.Select value={selectedSemester} onChange={(e)=>setSelectedSemester(e.target.value)}>
                  <option value="">All Semesters</option>
                  {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Academic Year</Form.Label>
                <Form.Select value={selectedAcademicYear} onChange={(e)=>setSelectedAcademicYear(e.target.value)}>
                  <option value="">All Years</option>
                  {academicYearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Query">Query</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {/* <Col md={2}>
              <Form.Group>
                <Form.Label>Event Type</Form.Label>
                <Form.Select value={eventTypeFilter} onChange={(e)=>setEventTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  {eventTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </Form.Select>
              </Form.Group>
            </Col> */}
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <Form.Control
                    placeholder="Search name, club, venue..."
                    value={searchTerm}
                    onChange={(e)=>setSearchTerm(e.target.value)}
                  />
                  {/* <Button variant="outline-secondary" onClick={applyFilters}>Go</Button> */}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mt-2 mt-md-0">
                <Form.Label>Sort By</Form.Label>
                <Form.Select value={sortOrder} onChange={(e)=>setSortOrder(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-az">Name A-Z</option>
                  <option value="name-za">Name Z-A</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex gap-2">
              <Button variant="outline-danger" className="w-100" onClick={handleReset}>Reset</Button>
            </Col>
            <Col md={7} className="d-flex flex-wrap gap-2 mt-3">
              <Badge bg="secondary">Total: {displayEvents.length}</Badge>
              <Badge bg="success">Approved: {displayEvents.filter(e=>getOverallStatus(e.approvals)==='Approved').length}</Badge>
              <Badge bg="warning" text="dark">Pending: {displayEvents.filter(e=>getOverallStatus(e.approvals)==='Pending').length}</Badge>
              <Badge bg="danger">Rejected: {displayEvents.filter(e=>getOverallStatus(e.approvals)==='Rejected').length}</Badge>
              <Badge bg="info" text="dark">Query: {displayEvents.filter(e=>getOverallStatus(e.approvals)==='Query').length}</Badge>
            </Col>
          </Row>
        </Form>
      </div>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {Object.keys(groupedEvents).length > 0 ? (
            <Accordion defaultActiveKey="0" className="mb-4">
              {Object.entries(groupedEvents).map(([semester, semesterEvents], index) => (
                <Accordion.Item eventKey={index.toString()} key={semester}>
                  <Accordion.Header>
                    {semester} ({semesterEvents.length} event{semesterEvents.length !== 1 ? 's' : ''})
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="card-container">
                      {semesterEvents.map(renderEventCard)}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          ) : (
            <p>No events found.</p>
          )}
        </>
      )}
    </Container>
  );
};

export default Dashboard;
