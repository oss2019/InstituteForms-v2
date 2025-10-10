import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./PendingApprovals.css"; // Import styles for leaves
import { Card, Button, Row, Col, Form, InputGroup, Container, Accordion, Badge } from "react-bootstrap";

const PendingApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]); // raw from server
  const [displayApprovals, setDisplayApprovals] = useState([]);  // filtered client-side
  const [groupedDisplay, setGroupedDisplay] = useState({});
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState("");
  const [approvalAction, setApprovalAction] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [userRole, setUserRole] = useState('');
  
  // Filter states
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [myActionFilter, setMyActionFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [eventTypeOptions, setEventTypeOptions] = useState([]);
  const searchDebounceRef = useRef(null);
  
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

  // Fetch pending approvals on mount and when filters change
  const fetchPendingApprovals = async (page = 1, resetPage = false) => {
    setLoading(true);
    try {
      const storedUserRole = localStorage.getItem("role");
      setUserRole(storedUserRole);
      const userCategory = localStorage.getItem("category");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      
      const requestData = {
        role: storedUserRole,
        category: storedUserRole === "general-secretary" ? userCategory : null,
        semester: selectedSemester || undefined,
        academicYear: selectedAcademicYear || undefined,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        eventType: eventTypeFilter || undefined,
        sort: sortOrder || undefined,
        page: resetPage ? 1 : page,
        limit: 10
      };

      const pendingResponse = await axios.post(`${apiUrl}/event/pending/filtered`, requestData);

      console.log("Pending Approvals: ", pendingResponse.data);
  setPendingApprovals(pendingResponse.data.applications);
  setDisplayApprovals(pendingResponse.data.applications);
  // Build event type options
  const types = Array.from(new Set(pendingResponse.data.applications.map(a=> a.eventType).filter(Boolean))).sort();
  setEventTypeOptions(types);
  // Initial grouping
  groupBySemester(pendingResponse.data.applications);
      setPagination(pendingResponse.data.pagination);

      if (resetPage) {
        setCurrentPage(1);
      }

    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      setError("Failed to fetch pending approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // Group helper
  const groupBySemester = (list) => {
    const grouped = list.reduce((acc, ev)=> {
      const key = ev.semester || `${ev.academicYear || 'Academic Year'}`;
      acc[key] = acc[key] || [];
      acc[key].push(ev);
      return acc;
    }, {});
    setGroupedDisplay(grouped);
  };

  // Apply client-side filters
  const applyFilters = () => {
    let result = [...pendingApprovals];
    if (selectedSemester) result = result.filter(e=> e.semester === selectedSemester);
    if (selectedAcademicYear) result = result.filter(e=> e.academicYear === selectedAcademicYear);
    if (eventTypeFilter) result = result.filter(e=> (e.eventType||'').toLowerCase().includes(eventTypeFilter.toLowerCase()));
    if (statusFilter) {
      result = result.filter(e=> {
        const st = e.approvals.find(a=> a.role === userRole)?.status || 'Pending';
        return st === statusFilter;
      });
    }
    if (myActionFilter) {
      result = result.filter(e=> {
        const myStatus = e.approvals.find(a=> a.role === userRole)?.status || 'Pending';
        switch (myActionFilter) {
          case 'approved': return myStatus === 'Approved';
          case 'rejected': return myStatus === 'Rejected';
          case 'query': return myStatus === 'Query';
          case 'pending': return myStatus === 'Pending';
          default: return true;
        }
      });
    }
    if (searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      result = result.filter(e=> (
        e.eventName?.toLowerCase().includes(s) ||
        e.nameOfTheOrganizer?.toLowerCase().includes(s) ||
        e.eventVenue?.toLowerCase().includes(s) ||
        e.eventType?.toLowerCase().includes(s) ||
        e.semester?.toLowerCase().includes(s)
      ));
    }
    // Sort
    switch (sortOrder) {
      case 'oldest': result.sort((a,b)=> new Date(a.startDate) - new Date(b.startDate)); break;
      case 'name-az': result.sort((a,b)=> a.eventName.localeCompare(b.eventName)); break;
      case 'name-za': result.sort((a,b)=> b.eventName.localeCompare(a.eventName)); break;
      default: result.sort((a,b)=> new Date(b.startDate) - new Date(a.startDate));
    }
    setDisplayApprovals(result);
    groupBySemester(result);
  };

  // Debounce effect
  useEffect(()=> {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(()=> applyFilters(), 400);
    return ()=> clearTimeout(searchDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedSemester, selectedAcademicYear, statusFilter, eventTypeFilter, sortOrder, myActionFilter, pendingApprovals, userRole]);

  // Manual trigger (e.g., after server refetch)
  const handleFilterChange = () => applyFilters();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); applyFilters(); };

  const clearFilters = () => {
    setSelectedSemester('');
    setSelectedAcademicYear('');
    setSearchTerm('');
    setStatusFilter('');
    setEventTypeFilter('');
    setMyActionFilter('');
    setSortOrder('newest');
    applyFilters();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchPendingApprovals(newPage);
  };

  const handleStatusUpdate = async (applicationId, role, status, comment = "") => {
    try {
      console.log("Sending request with:", { applicationId, role, status, comment }); // Debug log
      
      if (status === "Query") {
        // Use the raise-query endpoint for queries
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:4001"}/event/raise-query`,
          { applicationId, role, queryText: comment }
        );
        console.log("Query raised successfully:", response.data);
      } else {
        // Use the existing endpoint for approve/reject
        const response = await axios.patch(
          `${import.meta.env.VITE_API_URL || "http://localhost:4001"}/event/${applicationId}/status`,
          { applicationId, role, status, comment }
        );
        console.log("Response received:", response.data);
      }
      
      if (status === "Query") {
        // For queries, update the local state instead of removing the event
        setPendingApprovals((prev) =>
          prev.map((approval) => {
            if (approval._id === applicationId) {
              const updatedApprovals = approval.approvals.map((app) => 
                app.role === role ? { ...app, status: "Query", comment: `Query raised: ${comment}` } : app
              );
              return { ...approval, approvals: updatedApprovals };
            }
            return approval;
          })
        );
      } else {
        // For approve/reject, remove from pending list
        setPendingApprovals((prev) =>
          prev.filter((approval) => approval._id !== applicationId)
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status. Please try again.");
    }
  };

  const handleApprovalClick = (application, action) => {
    setSelectedApplication(application);
    setApprovalAction(action);
    setShowModal(true);
  };

  const handleModalSubmit = () => {
    if (approvalAction && selectedApplication) {
      handleStatusUpdate(selectedApplication._id, userRole, approvalAction, comment);
      setShowModal(false);
      setComment("");
      setApprovalAction(null);
      setSelectedApplication(null);
    }
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setComment("");
    setApprovalAction(null);
    setSelectedApplication(null);
  };
  const getActionLabel = (action) => {
    switch(action) {
      case "Approved": return "Approve";
      case "Rejected": return "Reject";
      case "Query": return "Raise Query";
      default: return action;
    }
  };
  const action = getActionLabel(approvalAction);
  const handleViewDetails = (eventId) => {
    navigate(`/event-details/${eventId}`);
  };

  const renderEventCard = (approval) => (
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
            <strong>Semester:</strong> {approval.semester || 'Not specified'} <br />
            <strong>Status:</strong> {approval.approvals.find(app => app.role === userRole)?.status || "Pending"}
          </Card.Text>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              className="mb-1"
              variant="primary"
              onClick={() => handleViewDetails(approval._id)}
            >
              View Details
            </Button>
            {(() => {
              const currentUserApproval = approval.approvals.find(app => app.role === userRole);
              const hasQueryStatus = currentUserApproval?.status === "Query";
              
              if (hasQueryStatus) {
                return (
                  <span className="text-warning mb-1 p-2">
                    <strong>Query Raised - Waiting for Response</strong>
                  </span>
                );
              } else {
                return (
                  <>
                    <Button
                      className="mb-1"
                      variant="success"
                      onClick={() => handleApprovalClick(approval, "Approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      className="mb-1"
                      variant="danger"
                      onClick={() => handleApprovalClick(approval, "Rejected")}
                    >
                      Reject
                    </Button>
                    {userRole !== "club-secretary" && (
                      <Button
                        className="mb-1"
                        variant="warning"
                        onClick={() => handleApprovalClick(approval, "Query")}
                      >
                        Raise Query
                      </Button>
                    )}
                  </>
                );
              }
            })()}
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container className="list-of-leaves">
  <h2 className="mb-3">Pending Event Applications</h2>
      
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
          <Col md={2}>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select value={statusFilter} onChange={(e)=> setStatusFilter(e.target.value)}>
                <option value="">All</option>
                {/* <option value="Approved">Approved</option> */}
                <option value="Pending">Pending</option>
                {/* <option value="Rejected">Rejected</option> */}
                <option value="Query">Query</option>
              </Form.Select>
            </Form.Group>
          </Col>
          {/* <Col md={2}>
            <Form.Group>
              <Form.Label>My Action</Form.Label>
              <Form.Select value={myActionFilter} onChange={(e)=> setMyActionFilter(e.target.value)}>
                <option value="">All</option>
                <option value="approved">I Approved</option>
                <option value="rejected">I Rejected</option>
                <option value="query">I Raised Query</option>
                <option value="pending">Awaiting My Action</option>
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
              <Form as="form" onSubmit={handleSearchSubmit}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search events, organizers, venues..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  {/* <Button variant="outline-secondary" type="submit">Search</Button> */}
                </InputGroup>
              </Form>
            </Form.Group>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <Button variant="outline-danger" className="w-100" onClick={clearFilters}>Reset</Button>
          </Col>
          <Col md={12} className="mt-2 d-flex flex-wrap gap-2">
            <Badge bg="secondary">Total: {displayApprovals.length}</Badge>
            <Badge bg="warning" text="dark">Pending: {displayApprovals.filter(a=> (a.approvals.find(ap=> ap.role===userRole)?.status||'Pending')==='Pending').length}</Badge>
            <Badge bg="info" text="dark">Query: {displayApprovals.filter(a=> (a.approvals.find(ap=> ap.role===userRole)?.status)==='Query').length}</Badge>
            {/* <Badge bg="success">Approved (Mine): {displayApprovals.filter(a=> (a.approvals.find(ap=> ap.role===userRole)?.status)==='Approved').length}</Badge>
            <Badge bg="danger">Rejected (Mine): {displayApprovals.filter(a=> (a.approvals.find(ap=> ap.role===userRole)?.status)==='Rejected').length}</Badge> */}
          </Col>
        </Row>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          {/* Grouped Pending Applications */}
          {Object.keys(groupedDisplay).length > 0 ? (
            <Accordion defaultActiveKey="0" className="mb-4">
              {Object.entries(groupedDisplay).map(([semester, events], index) => (
                <Accordion.Item eventKey={index.toString()} key={semester}>
                  <Accordion.Header>
                    {semester} ({events.length} pending event{events.length !== 1 ? 's' : ''})
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
            <p>No Pending Event Applications available.</p>
          )}

          {/* Pagination */}
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

      {/* Comment Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "400px",
            maxWidth: "600px"
          }}>
            <h4>{action} Event</h4>
            <p>You are about to <strong>{action.toLowerCase()}</strong> the event: <strong>{selectedApplication?.eventName}</strong></p>
            
            <div className="form-group mb-3">
              <label htmlFor="comment">
                {approvalAction === "Query" ? "Query Text (Required):" : "Comment (Optional):"}
              </label>
              <textarea
                id="comment"
                className="form-control"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  approvalAction === "Query" 
                    ? "Please describe your query or concern about this event..." 
                    : `Add your ${action.toLowerCase()} comment...`
                }
                required={approvalAction === "Query"}
              />
              {approvalAction === "Query" && !comment.trim() && (
                <small className="text-danger">Query text is required</small>
              )}
            </div>

            <div className="modal-buttons">
              <button
                className="btn btn-secondary me-2 mb-2"
                onClick={handleModalCancel}
              >
                Cancel
              </button>
              <button
                className={`btn ${
                  approvalAction === "Approved" ? "btn-success" : 
                  approvalAction === "Rejected" ? "btn-danger" : 
                  "btn-warning"
                }`}
                onClick={handleModalSubmit}
                disabled={approvalAction === "Query" && !comment.trim()}
              >
                Confirm {action}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default PendingApprovals;
