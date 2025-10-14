import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ProcessedEventApplications.css';
import { Card, Container, Row, Col, Form, Button, InputGroup, Accordion, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [rejectedApplications, setRejectedApplications] = useState([]);
  const [closedApplications, setClosedApplications] = useState([]);
  const [displayApproved, setDisplayApproved] = useState([]);
  const [displayRejected, setDisplayRejected] = useState([]);
  const [displayClosed, setDisplayClosed] = useState([]);
  const [groupedApproved, setGroupedApproved] = useState({});
  const [groupedRejected, setGroupedRejected] = useState({});
  const [groupedClosed, setGroupedClosed] = useState({});
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('approved');
  
  // Filter states
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [myActionFilter, setMyActionFilter] = useState(''); // New filter for user's own action
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const searchDebounceRef = useRef(null);
  const [eventTypeOptions, setEventTypeOptions] = useState([]);
  
  const navigate = useNavigate();

  // Fetch semester options
  useEffect(() => {
    const fetchSemesterOptions = async () => {
      try {
        const storedUserRole = localStorage.getItem("role");
        const userCategory = localStorage.getItem('category');
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001';
        const response = await axios.get(`${apiUrl}/event/semesters/options`, {
          params: {
            role: storedUserRole,
            category: storedUserRole === 'general-secretary' ? userCategory : null,
          }
        });
        
        setSemesterOptions(response.data);
      } catch (error) {
        console.error('Error fetching semester options:', error);
      }
    };

    fetchSemesterOptions();
  }, []);

  // Fetch applications with filters
  const fetchApplications = async (page = 1, resetPage = false) => {
    setLoading(true);
    try {
      const storedUserRole = localStorage.getItem("role");
      setUserRole(storedUserRole);
      const userCategory = localStorage.getItem('category');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001';
      
      const requestData = {
        role: storedUserRole,
        category: storedUserRole === 'general-secretary' ? userCategory : null,
        semester: selectedSemester || undefined,
        academicYear: selectedAcademicYear || undefined,
        search: searchTerm || undefined,
        page: resetPage ? 1 : page,
        limit: 10
      };

      // Fetch approved applications with filters
      const approvedResponse = await axios.post(`${apiUrl}/event/approved/filtered`, requestData);
  setApprovedApplications(approvedResponse.data.applications);
  setDisplayApproved(approvedResponse.data.applications);
  setGroupedApproved(approvedResponse.data.groupedBySemester);
  setPagination(approvedResponse.data.pagination);

      // For rejected applications, use existing endpoint for now
      const rejectedResponse = await axios.post(`${apiUrl}/event/rejected`, {
        role: storedUserRole,
        category: storedUserRole === 'general-secretary' ? userCategory : null,
      });
  setRejectedApplications(rejectedResponse.data);
  setDisplayRejected(rejectedResponse.data);
      
      // Group rejected applications by semester
      const groupedRejected = rejectedResponse.data.reduce((groups, app) => {
        const semesterKey = app.semester || `${app.academicYear} Academic Year`;
        if (!groups[semesterKey]) {
          groups[semesterKey] = [];
        }
        groups[semesterKey].push(app);
        return groups;
      }, {});
      setGroupedRejected(groupedRejected);

      // Fetch closed applications (only for authorized roles)
      if (['associate-dean', 'dean', 'ARSW'].includes(storedUserRole)) {
        try {
          const closedResponse = await axios.post(`${apiUrl}/event/closed`, {
            role: storedUserRole,
            category: storedUserRole === 'general-secretary' ? userCategory : null,
          });
          setClosedApplications(closedResponse.data);
          setDisplayClosed(closedResponse.data);
          
          // Group closed applications by semester
          const groupedClosed = closedResponse.data.reduce((groups, app) => {
            const semesterKey = app.semester || `${app.academicYear} Academic Year`;
            if (!groups[semesterKey]) {
              groups[semesterKey] = [];
            }
            groups[semesterKey].push(app);
            return groups;
          }, {});
          setGroupedClosed(groupedClosed);
        } catch (error) {
          console.error('Error fetching closed applications:', error);
        }
      }

      // Event type options
      const types = Array.from(new Set([
        ...approvedResponse.data.applications.map(a=>a.eventType).filter(Boolean),
        ...rejectedResponse.data.map(a=>a.eventType).filter(Boolean),
        ...(closedApplications || []).map(a=>a.eventType).filter(Boolean)
      ])).sort();
      setEventTypeOptions(types);

      if (resetPage) {
        setCurrentPage(1);
      }

    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Re-group helper
  const groupBySemester = (list, setGroupFn) => {
    const grouped = list.reduce((groups, app) => {
      const semesterKey = app.semester || `${app.academicYear} Academic Year`;
      if (!groups[semesterKey]) groups[semesterKey] = [];
      groups[semesterKey].push(app);
      return groups;
    }, {});
    setGroupFn(grouped);
  };

  const applyFilters = () => {
    // Apply to approved and rejected separately
    const run = (source, setDisplay, setGrouped) => {
      let result = [...source];
      if (selectedSemester) result = result.filter(e=> e.semester === selectedSemester);
      if (selectedAcademicYear) result = result.filter(e=> e.academicYear === selectedAcademicYear);
      if (eventTypeFilter) result = result.filter(e=> e.eventType === eventTypeFilter);
      if (statusFilter) {
        result = result.filter(e => getOverallStatus(e.approvals).toLowerCase() === statusFilter.toLowerCase());
      }
      if (searchTerm.trim()) {
        const s = searchTerm.trim().toLowerCase();
        result = result.filter(e => (
          e.eventName?.toLowerCase().includes(s) ||
          e.nameOfTheOrganizer?.toLowerCase().includes(s) ||
          e.eventVenue?.toLowerCase().includes(s) ||
          e.eventType?.toLowerCase().includes(s) ||
          e.semester?.toLowerCase().includes(s)
        ));
      }
      if (myActionFilter && userRole) {
        result = result.filter(e => {
          const myStatus = e.approvals.find(a=> a.role === userRole)?.status || '';
            switch (myActionFilter) {
              case 'approved': return myStatus === 'Approved';
              case 'rejected': return myStatus === 'Rejected';
              case 'query': return myStatus === 'Query';
              case 'pending': return myStatus === 'Pending';
              default: return true;
            }
        });
      }
      switch (sortOrder) {
        case 'oldest': result.sort((a,b)=> new Date(a.startDate)-new Date(b.startDate)); break;
        case 'name-az': result.sort((a,b)=> a.eventName.localeCompare(b.eventName)); break;
        case 'name-za': result.sort((a,b)=> b.eventName.localeCompare(a.eventName)); break;
        default: result.sort((a,b)=> new Date(b.startDate)-new Date(a.startDate));
      }
      setDisplay(result);
      groupBySemester(result, setGrouped);
    };
    run(approvedApplications, setDisplayApproved, setGroupedApproved);
    run(rejectedApplications, setDisplayRejected, setGroupedRejected);
    run(closedApplications, setDisplayClosed, setGroupedClosed);
  };

  useEffect(()=> {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(()=> applyFilters(), 400);
    return ()=> clearTimeout(searchDebounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedSemester, selectedAcademicYear, statusFilter, eventTypeFilter, sortOrder, myActionFilter, userRole, approvedApplications, rejectedApplications, closedApplications]);

  const handleFilterChange = () => applyFilters();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications(1, true);
  };

  const clearFilters = () => {
    setSelectedSemester('');
    setSelectedAcademicYear('');
    setSearchTerm('');
    setStatusFilter('');
    setEventTypeFilter('');
    setSortOrder('newest');
    setMyActionFilter('');
    applyFilters();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchApplications(newPage);
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

  const renderEventCard = (application) => (
    <Col md={6} key={application._id}>
      <Card 
        className={`dashboard-card mb-4 ${getOverallStatus(application.approvals).toLowerCase()}`}
        style={{ cursor: 'pointer' }}
        onClick={() => handleViewDetails(application._id)}
      >
        <Card.Body>
          <Card.Title>{`${application.eventType} Event` || 'Unknown Event'}</Card.Title>
          <Card.Text>
            <strong>Organizer:</strong> {application.nameOfTheOrganizer || 'Unknown Organizer'} <br />
            <strong>Email:</strong> {application.email || 'No Email Provided'} <br />
            <strong>Event Name:</strong> {application.eventName} <br />
            <strong>Venue:</strong> {application.eventVenue || 'Venue not specified'} <br />
            <strong>Date:</strong> {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()} <br />
            <strong>Semester:</strong> {application.semester || 'Not specified'} <br />
            <strong>Current Status:</strong> {getOverallStatus(application.approvals)} <br />
            <strong>My Comment:</strong> {application.approvals.find(app => app.role === userRole)?.comment || 'No comment'}
          </Card.Text>
        </Card.Body>
      </Card>
    </Col>
  );

  const renderGroupedEvents = (groupedEvents, title) => (
    <>
      <h2>{title}</h2>
      {Object.keys(groupedEvents).length > 0 ? (
        <Accordion defaultActiveKey="0" className="mb-4">
          {Object.entries(groupedEvents).map(([semester, events], index) => (
            <Accordion.Item eventKey={index.toString()} key={semester}>
              <Accordion.Header>
                {semester} ({events.length} event{events.length !== 1 ? 's' : ''})
              </Accordion.Header>
              <Accordion.Body>
                <Row>
                  {events.map(renderEventCard)}
                </Row>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      ) : (
        <p>No {title.toLowerCase()} available.</p>
      )}
    </>
  );

  const canViewClosedEvents = () => {
    return ['associate-dean', 'dean', 'ARSW'].includes(userRole);
  };

  return (
    <Container className="dashboard-container">
      {/* Tabs for Approved, Rejected, and Closed */}
      <div className="tabs-section mb-4">
        <div className="btn-group w-100" role="group">
          <button
            type="button"
            className={`btn ${activeTab === 'approved' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({displayApproved.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({displayRejected.length})
          </button>
          {canViewClosedEvents() && (
            <button
              type="button"
              className={`btn ${activeTab === 'closed' ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('closed')}
            >
              Closed ({displayClosed.length})
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filters-section mb-4 p-3 border rounded">
        <h5>Filter Events</h5>
        <Row className="g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Semester</Form.Label>
              <Form.Select 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">All Semesters</option>
                {semesterOptions.map((option, index) => (
                  <option key={index} value={option.semester}>
                    {option.display}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Academic Year</Form.Label>
              <Form.Select 
                value={selectedAcademicYear} 
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                <option value="">All Years</option>
                {[...new Set(semesterOptions.map(option => option.academicYear))].map((year, index) => (
                  <option key={index} value={year}>
                    {year}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          {/* <Col md={2}>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select value={statusFilter} onChange={(e)=> setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
                <option value="Query">Query</option>
              </Form.Select>
            </Form.Group>
          </Col> */}
          {/* <Col md={2}>
            <Form.Group>
              <Form.Label>My Action</Form.Label>
              <Form.Select value={myActionFilter} onChange={(e)=> setMyActionFilter(e.target.value)}>
                <option value="">All</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
          </Col> */}
          {localStorage.getItem("role") !== 'general-secretary' && (
          <Col md={2}>
            <Form.Group>
              <Form.Label>Event Type</Form.Label>
              <Form.Select value={eventTypeFilter} onChange={(e)=> setEventTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {eventTypeOptions.map(t=> <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>)}
          <Col md={2}>
            <Form.Group>
              <Form.Label>Sort</Form.Label>
              <Form.Select value={sortOrder} onChange={(e)=> setSortOrder(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name-az">Name A-Z</option>
                <option value="name-za">Name Z-A</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Search</Form.Label>
              <InputGroup>
                <Form.Control
                  placeholder="Search name, venue, type..."
                  value={searchTerm}
                  onChange={(e)=> setSearchTerm(e.target.value)}
                />
                {/* <Button variant="outline-secondary" onClick={applyFilters}>Go</Button> */}
              </InputGroup>
            </Form.Group>
          </Col>
          <Col md={2} className="d-flex gap-2 align-items-end">
            <Button variant="outline-danger" className="w-100" onClick={clearFilters}>Reset</Button>
          </Col>
          <Col md={12} className="mt-2 d-flex flex-wrap gap-2">
            <Badge bg="secondary">Approved: {displayApproved.length}</Badge>
            <Badge bg="danger">Rejected: {displayRejected.length}</Badge>
            {canViewClosedEvents() && <Badge bg="dark">Closed: {displayClosed.length}</Badge>}
            <Badge bg="warning" text="dark">Pending: {approvedApplications.filter(a=> getOverallStatus(a.approvals)==='Pending').length}</Badge>
            <Badge bg="info" text="dark">Query: {approvedApplications.filter(a=> getOverallStatus(a.approvals)==='Query').length}</Badge>
          </Col>
        </Row>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          {/* Render based on active tab */}
          {activeTab === 'approved' && (
            <>
              {renderGroupedEvents(groupedApproved, "Approved Event Applications")}
              
              {/* Pagination for Approved Events */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mb-4">
                  <Button 
                    variant="outline-primary" 
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="me-2"
                  >
                    Previous
                  </Button>
                  <span className="align-self-center mx-3">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button 
                    variant="outline-primary" 
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {activeTab === 'rejected' && (
            <>
              {renderGroupedEvents(groupedRejected, "Rejected Event Applications")}
            </>
          )}

          {activeTab === 'closed' && canViewClosedEvents() && (
            <>
              {renderGroupedEvents(groupedClosed, "Closed Event Applications")}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default StaffDashboard;
