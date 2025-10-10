// Import necessary dependencies from React, libraries, and local files.
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./PendingApprovals.css"; // Custom styles for this component

// Import UI components from react-bootstrap
import { 
  Card, 
  Button, 
  Row, 
  Col, 
  Form, 
  InputGroup, 
  Container, 
  Accordion, 
  Badge,
  Modal, // Import Modal for a better user experience
  Spinner // Import Spinner for a better loading indicator
} from "react-bootstrap";

/**
 * PendingApprovals Component
 * * This component fetches, displays, and manages event applications that are awaiting approval.
 * It provides functionalities for filtering, sorting, searching, and taking action (Approve, Reject, Query)
 * on these applications, tailored to the logged-in user's role.
 */
const PendingApprovals = () => {
  // --- STATE MANAGEMENT ---

  // Data state
  const [pendingApprovals, setPendingApprovals] = useState([]); // Stores the raw list of applications from the server
  const [displayApprovals, setDisplayApprovals] = useState([]); // Stores the filtered and sorted list for display
  const [groupedDisplay, setGroupedDisplay] = useState({});   // Stores applications grouped by semester for the accordion view

  // UI/UX state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState("");
  const [approvalAction, setApprovalAction] = useState(null); // 'Approved', 'Rejected', or 'Query'
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Filter & Sort state
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Options for dropdowns
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [eventTypeOptions, setEventTypeOptions] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Refs and Hooks
  const searchDebounceRef = useRef(null); // Ref for debouncing search input
  const navigate = useNavigate();

  // --- DATA FETCHING & SIDE EFFECTS ---

  // Effect to fetch semester options for the filter dropdown on component mount.
  useEffect(() => {
    const fetchSemesterOptions = async () => {
      try {
        const storedUserRole = localStorage.getItem("role");
        const userCategory = localStorage.getItem('category');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001';

        const response = await axios.get(`${apiUrl}/event/semesters/options`, {
          params: {
            role: storedUserRole,
            category: storedUserRole === 'general-secretary' ? userCategory : undefined,
          }
        });
        setSemesterOptions(response.data);
      } catch (error) {
        console.error('Error fetching semester options:', error);
      }
    };
    fetchSemesterOptions();
  }, []);

  // Main data fetching function for pending approvals. Called on mount and on page change.
  const fetchPendingApprovals = async (page = 1) => {
    setLoading(true);
    try {
      const storedUserRole = localStorage.getItem("role");
      setUserRole(storedUserRole);
      const userCategory = localStorage.getItem("category");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      
      const requestData = {
        role: storedUserRole,
        category: storedUserRole === "general-secretary" ? userCategory : undefined,
        page,
        limit: 10 // Set a limit for pagination
      };

      const response = await axios.post(`${apiUrl}/event/pending/filtered`, requestData);
      
      const applications = response.data.applications;
      setPendingApprovals(applications);
      setDisplayApprovals(applications); // Initially, display matches the fetched data
      setPagination(response.data.pagination);

      // Dynamically create event type options from the fetched data
      const types = Array.from(new Set(applications.map(a => a.eventType).filter(Boolean))).sort();
      setEventTypeOptions(types);
      
      // Group the initial data
      groupBySemester(applications);

    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      setError("Failed to fetch pending approvals. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when the component mounts.
  useEffect(() => {
    fetchPendingApprovals(currentPage);
  }, []); // Note: We only fetch from the server on mount/page change. Filtering is client-side.


  // --- HELPER FUNCTIONS ---

  // Helper to group events by semester for the accordion view.
  const groupBySemester = (list) => {
    const grouped = list.reduce((acc, ev) => {
      const key = ev.semester || `Academic Year: ${ev.academicYear || 'N/A'}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(ev);
      return acc;
    }, {});
    setGroupedDisplay(grouped);
  };

  // --- FILTERING LOGIC ---

  // This effect applies client-side filters whenever a filter state changes.
  // It uses a debounce for the search term to prevent re-filtering on every keystroke.
  useEffect(() => {
    // Debounce function to delay filter application
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      let result = [...pendingApprovals]; // Start with the original fetched data

      // Apply filters sequentially
      if (selectedSemester) result = result.filter(e => e.semester === selectedSemester);
      if (selectedAcademicYear) result = result.filter(e => e.academicYear === selectedAcademicYear);
      if (eventTypeFilter) result = result.filter(e => e.eventType === eventTypeFilter);
      
      if (statusFilter) {
        result = result.filter(e => {
          const myStatus = e.approvals.find(a => a.role === userRole)?.status || 'Pending';
          return myStatus === statusFilter;
        });
      }

      if (searchTerm.trim()) {
        const s = searchTerm.trim().toLowerCase();
        result = result.filter(e => 
          e.eventName?.toLowerCase().includes(s) ||
          e.nameOfTheOrganizer?.toLowerCase().includes(s) ||
          e.eventVenue?.toLowerCase().includes(s)
        );
      }

      // Apply sorting
      switch (sortOrder) {
        case 'oldest':
          result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
          break;
        case 'name-az':
          result.sort((a, b) => a.eventName.localeCompare(b.eventName));
          break;
        case 'name-za':
          result.sort((a, b) => b.eventName.localeCompare(a.eventName));
          break;
        default: // 'newest'
          result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
          break;
      }
      
      setDisplayApprovals(result);
      groupBySemester(result);

    }, 300); // 300ms debounce delay

    // Cleanup function to clear the timeout
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm, selectedSemester, selectedAcademicYear, statusFilter, eventTypeFilter, sortOrder, pendingApprovals, userRole]);


  // --- EVENT HANDLERS ---

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchPendingApprovals(newPage);
  };
  
  const clearFilters = () => {
    setSelectedSemester('');
    setSelectedAcademicYear('');
    setSearchTerm('');
    setStatusFilter('');
    setEventTypeFilter('');
    setSortOrder('newest');
    // The useEffect hook will automatically re-apply filters and show the original data.
  };

  // Handles approving, rejecting, or raising a query on an application.
  const handleStatusUpdate = async () => {
    if (!approvalAction || !selectedApplication) return;
    
    // Disable form while submitting
    const { _id: applicationId } = selectedApplication;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      
      if (approvalAction === "Query") {
        await axios.post(`${apiUrl}/event/raise-query`, {
          applicationId, role: userRole, queryText: comment
        });
        
        // Update local state to reflect the query status immediately
        setPendingApprovals(prev =>
          prev.map(app => {
            if (app._id === applicationId) {
              const updatedApprovals = app.approvals.map(approval => 
                approval.role === userRole ? { ...approval, status: "Query" } : approval
              );
              return { ...app, approvals: updatedApprovals };
            }
            return app;
          })
        );

      } else { // Handle 'Approved' or 'Rejected'
        await axios.patch(`${apiUrl}/event/${applicationId}/status`, {
          applicationId, role: userRole, status: approvalAction, comment
        });
        
        // For approve/reject, remove the item from the list immediately for a better UX
        setPendingApprovals(prev => prev.filter(app => app._id !== applicationId));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status. Please try again.");
    } finally {
      // Close and reset the modal regardless of success or failure
      handleModalCancel();
    }
  };

  // Opens the confirmation modal and sets the context.
  const handleApprovalClick = (application, action) => {
    setSelectedApplication(application);
    setApprovalAction(action);
    setShowModal(true);
  };

  // Closes and resets the modal state.
  const handleModalCancel = () => {
    setShowModal(false);
    setComment("");
    setApprovalAction(null);
    setSelectedApplication(null);
  };
  
  const handleViewDetails = (eventId) => {
    navigate(`/event-details/${eventId}`);
  };

  // Helper to get a user-friendly label for the modal title.
  const getActionLabel = (action) => {
    switch (action) {
      case "Approved": return "Approve";
      case "Rejected": return "Reject";
      case "Query": return "Raise Query";
      default: return "Confirm Action";
    }
  };

  // --- RENDER LOGIC ---

  // Renders a single event card.
  const renderEventCard = (approval) => {
    const myApproval = approval.approvals.find(app => app.role === userRole);
    const myStatus = myApproval?.status || "Pending";

    return (
      <Col xl={6} md={12} key={approval._id} className="mb-3">
        <Card className="dashboard-card h-100">
          <Card.Body className="d-flex flex-column">
            <Card.Title>{approval.eventName || "Untitled Event"}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{approval.eventType} Event</Card.Subtitle>
            <p className="card-text mb-1"><strong>Organizer:</strong> {approval.nameOfTheOrganizer || "N/A"}</p>
            <p className="card-text mb-1"><strong>Venue:</strong> {approval.eventVenue || "N/A"}</p>
            <p className="card-text mb-3"><strong>Date:</strong> {new Date(approval.startDate).toLocaleDateString()}</p>
            
            <div className="mt-auto d-flex align-items-center gap-2 flex-wrap">
              <Button size="sm" variant="primary" onClick={() => handleViewDetails(approval._id)}>
                View Details
              </Button>
              {myStatus === "Query" ? (
                <Badge pill bg="info" text="dark" className="p-2">Query Raised</Badge>
              ) : (
                <>
                  <Button size="sm" variant="success" onClick={() => handleApprovalClick(approval, "Approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleApprovalClick(approval, "Rejected")}>
                    Reject
                  </Button>
                  {userRole !== "club-secretary" && (
                    <Button size="sm" variant="warning" onClick={() => handleApprovalClick(approval, "Query")}>
                      Raise Query
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card.Body>
          <Card.Footer>
            <small className="text-muted">My Status: <strong>{myStatus}</strong></small>
          </Card.Footer>
        </Card>
      </Col>
    );
  };
  
  // Main component render
  return (
    <Container fluid className="list-of-leaves py-4">
      <h2 className="mb-4">Pending Event Applications</h2>
      
      {/* Filter Controls Section */}
      <div className="filters-section mb-4 p-3">
        <Row className="g-3 align-items-end">
          <Col lg={3} md={6}>
            <Form.Group>
              <Form.Label>Semester</Form.Label>
              <Form.Select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                <option value="">All Semesters</option>
                {semesterOptions.map((opt, i) => <option key={i} value={opt.semester}>{opt.display}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg={3} md={6}>
            <Form.Group>
              <Form.Label>Academic Year</Form.Label>
              <Form.Select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)}>
                <option value="">All Years</option>
                {[...new Set(semesterOptions.map(opt => opt.academicYear))].map((year, i) => <option key={i} value={year}>{year}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg={2} md={6}>
            <Form.Group>
              <Form.Label>My Status</Form.Label>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Query">Query Raised</option>
              </Form.Select>
            </Form.Group>
          </Col>
          {localStorage.getItem("role") !== 'general-secretary' && (
            <Col lg={2} md={6}>
              <Form.Group>
                <Form.Label>Event Type</Form.Label>
                <Form.Select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  {eventTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          )}
           <Col lg={2} md={6}>
            <Form.Group>
              <Form.Label>Sort By</Form.Label>
              <Form.Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-az">Name A-Z</option>
                <option value="name-za">Name Z-A</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg={4} md={6}>
            <Form.Group>
              <Form.Label>Search</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search by name, organizer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Form.Group>
          </Col>
          <Col lg={2} md={6}>
            <Button variant="outline-secondary" className="w-100" onClick={clearFilters}>Reset Filters</Button>
          </Col>
        </Row>
         <Row className="mt-3">
            <Col className="d-flex flex-wrap gap-2">
                <Badge bg="secondary">Total Found: {displayApprovals.length}</Badge>
                <Badge bg="warning" text="dark">Pending My Action: {displayApprovals.filter(a => (a.approvals.find(ap => ap.role === userRole)?.status || 'Pending') === 'Pending').length}</Badge>
            </Col>
        </Row>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center p-5"><Spinner animation="border" /> <span className="ms-2">Loading Applications...</span></div>
      ) : error ? (
        <p className="text-danger text-center">{error}</p>
      ) : (
        <>
          {Object.keys(groupedDisplay).length > 0 ? (
            <Accordion defaultActiveKey="0" alwaysOpen>
              {Object.entries(groupedDisplay).map(([groupKey, events], index) => (
                <Accordion.Item eventKey={index.toString()} key={groupKey}>
                  <Accordion.Header>
                    {groupKey} ({events.length} event{events.length !== 1 ? 's' : ''})
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>{events.map(renderEventCard)}</Row>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          ) : (
            <p className="text-center mt-4">No pending event applications match your criteria.</p>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button variant="outline-primary" disabled={!pagination.hasPrev} onClick={() => handlePageChange(currentPage - 1)}>
                &laquo; Previous
              </Button>
              <span className="align-self-center mx-3">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button variant="outline-primary" disabled={!pagination.hasNext} onClick={() => handlePageChange(currentPage + 1)}>
                Next &raquo;
              </Button>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal (Using React-Bootstrap) */}
      <Modal show={showModal} onHide={handleModalCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>{getActionLabel(approvalAction)} Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You are about to <strong>{getActionLabel(approvalAction).toLowerCase()}</strong> the event: 
            <br/>
            <strong>{selectedApplication?.eventName}</strong>
          </p>
          <Form.Group>
            <Form.Label>
              {approvalAction === "Query" ? "Query Text (Required)" : "Comment (Optional)"}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={approvalAction === "Query" ? "Please state your query clearly..." : "Add an optional comment..."}
              required={approvalAction === "Query"}
            />
            {approvalAction === "Query" && !comment.trim() && (
                <Form.Text className="text-danger">A query message is required.</Form.Text>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalCancel}>
            Cancel
          </Button>
          <Button
            variant={
              approvalAction === "Approved" ? "success" : 
              approvalAction === "Rejected" ? "danger" : "warning"
            }
            onClick={handleStatusUpdate}
            disabled={approvalAction === "Query" && !comment.trim()}
          >
            Confirm {getActionLabel(approvalAction)}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default PendingApprovals;