import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button, Form, InputGroup, Row, Col, Accordion, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./EventDashboard.css";

const EventDashboard = () => {
  const [events, setEvents] = useState([]);
  const [displayEvents, setDisplayEvents] = useState([]);
  const [groupedEvents, setGroupedEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const searchDebounceRef = useRef(null);
  const navigate = useNavigate();

  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const fetchEventStatus = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
        const response = await axios.post(`${apiUrl}/event/user-events`, { userID: userId });
        const eventsData = response.data.events || [];
        setEvents(eventsData);
        prepareFilterOptions(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error.response?.data || error.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEventStatus();
  }, []);

  const prepareFilterOptions = (eventsData) => {
    const semesters = Array.from(new Set(eventsData.map(e => e.semester).filter(Boolean))).sort();
    const academicYears = Array.from(new Set(eventsData.map(e => e.academicYear).filter(Boolean))).sort().reverse();
    setSemesterOptions(semesters);
    setAcademicYearOptions(academicYears);
  };

  const groupEventsBySemester = (eventsData) => {
    const grouped = eventsData.reduce((groups, event) => {
      const semesterKey = event.semester || `${event.academicYear || "Unknown"} Academic Year`;
      if (!groups[semesterKey]) groups[semesterKey] = [];
      groups[semesterKey].push(event);
      return groups;
    }, {});
    setGroupedEvents(grouped);
  };

  const getOverallStatus = (approvals) => {
    if (approvals.some(app => app.status === "Rejected")) return "Rejected";
    if (approvals.some(app => app.status === "Query")) return "Query";
    if (approvals.every(app => app.status === "Approved")) return "Approved";
    return "Pending";
  };
  
  useEffect(() => {
    const applyFiltersAndSort = () => {
        let result = [...events];
        if (selectedSemester) result = result.filter(e => e.semester === selectedSemester);
        if (selectedAcademicYear) result = result.filter(e => e.academicYear === selectedAcademicYear);
        if (statusFilter) result = result.filter(e => getOverallStatus(e.approvals) === statusFilter);
        
        if (searchTerm.trim()) {
            const s = searchTerm.trim().toLowerCase();
            result = result.filter(e => 
                e.eventName?.toLowerCase().includes(s) || 
                e.clubName?.toLowerCase().includes(s)
            );
        }

        switch (sortOrder) {
            case "oldest": result.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
            case "name-az": result.sort((a,b) => a.eventName.localeCompare(b.eventName)); break;
            case "name-za": result.sort((a,b) => b.eventName.localeCompare(a.eventName)); break;
            default: result.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest
        }

        setDisplayEvents(result);
        groupEventsBySemester(result);
    };

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(applyFiltersAndSort, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm, selectedSemester, selectedAcademicYear, statusFilter, sortOrder, events]);


  const handleReset = () => {
    setSelectedSemester("");
    setSelectedAcademicYear("");
    setStatusFilter("");
    setSortOrder("newest");
    setSearchTerm("");
  };

  const handleViewDetails = (eventId) => navigate(`/event-details/${eventId}`);

  const renderEventCard = (event) => (
    <div key={event._id} className={`event-card ${getOverallStatus(event.approvals).toLowerCase()}`}>
        <h3>{event.eventName}</h3>
        <p><strong>Club:</strong> {event.clubName}</p>
        <p><strong>Dates:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
        <p><strong>Status:</strong> {getOverallStatus(event.approvals)}</p>
        <Button variant="primary" onClick={() => handleViewDetails(event._id)} className="w-100 mt-auto">
          View Details
        </Button>
    </div>
  );

  return (
    // Note: The outer container is gone. This component fits into the main layout.
    <>
      <h2 className="mb-3">My Event Applications</h2>
      <div className="filters-section p-3 mb-4">
        {/* ... Your entire <Form> with filters and badges ... */}
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
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <Form.Control
                    placeholder="Search name or club..."
                    value={searchTerm}
                    onChange={(e)=>setSearchTerm(e.target.value)}
                  />
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
            <Col md={2} className="d-flex align-items-end">
              <Button variant="outline-secondary" className="w-100" onClick={handleReset}>Reset</Button>
            </Col>
            <Col xs={12} className="d-flex flex-wrap gap-2 mt-3">
              <Badge bg="secondary">Total: {displayEvents.length}</Badge>
              <Badge bg="success">Approved: {displayEvents.filter(e=>getOverallStatus(e.approvals)==='Approved').length}</Badge>
              <Badge bg="warning" text="dark">Pending: {displayEvents.filter(e=>getOverallStatus(e.approvals)==='Pending').length}</Badge>
              <Badge bg="danger">Rejected: {displayEvents.filter(e=>getOverallStatus(e.approvals)==='Rejected').length}</Badge>
              <Badge bg="info" text="dark">Query: {displayEvents.filter(e=>getOverallStatus(e.approvals)==='Query').length}</Badge>
            </Col>
          </Row>
        </Form>
      </div>
      
      {loading ? <p>Loading events...</p> : (
        <>
          {Object.keys(groupedEvents).length > 0 ? (
            <Accordion defaultActiveKey="0" alwaysOpen>
              {Object.entries(groupedEvents).map(([semester, semesterEvents], index) => (
                <Accordion.Item eventKey={index.toString()} key={semester}>
                  <Accordion.Header>
                    {semester} <Badge bg="light" text="dark" className="ms-2">{semesterEvents.length}</Badge>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="card-container">
                      {semesterEvents.map(renderEventCard)}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          ) : <p>No events found for the selected criteria.</p>}
        </>
      )}
    </>
  );
};

export default EventDashboard;