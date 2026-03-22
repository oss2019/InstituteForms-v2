import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./PendingApprovals.css";

import { 
  Button, 
  Row, 
  Col, 
  Form, 
  InputGroup, 
  Container, 
  Accordion, 
  Badge,
  Modal,
  Spinner
} from "react-bootstrap";

const PendingApprovals = () => {
  // Data state - Initialize with empty arrays
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [initiatedApprovals, setInitiatedApprovals] = useState([]);
  const [displayApprovals, setDisplayApprovals] = useState([]);
  const [groupedDisplay, setGroupedDisplay] = useState({});

  // UI/UX state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    // Load activeTab from localStorage, default to 'pending' (Pending My Action)
    return localStorage.getItem('pendingApprovalsActiveTab') || 'pending';
  });

  // Counters for tabs (separate from filtered data)
  const [initiatedCount, setInitiatedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState("");
  const [approvalAction, setApprovalAction] = useState(null);
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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  const searchDebounceRef = useRef(null);
  const navigate = useNavigate();

  // Semester sorting helper - sorts chronologically (newest first)
  const sortSemestersChronologically = (semesters) => {
    return [...semesters].sort((a, b) => {
      const [aSeason, aYear] = a.semester.split(' ');
      const [bSeason, bYear] = b.semester.split(' ');
      const aYearNum = parseInt(aYear);
      const bYearNum = parseInt(bYear);

      if (aYearNum !== bYearNum) return bYearNum - aYearNum; // Descending by year
      // In same year: Autumn first (newer), then Spring (older)
      // Autumn 2025 > Spring 2025 chronologically
      return aSeason === 'Autumn' ? -1 : 1;
    });
  };

  // Set user role on mount
  useEffect(() => {
    const storedUserRole = localStorage.getItem("role");
    setUserRole(storedUserRole);
  }, []);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pendingApprovalsActiveTab', activeTab);
  }, [activeTab]);

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
            category: storedUserRole === 'general-secretary' ? userCategory : undefined,
          }
        });
        // Sort semesters chronologically (latest first)
        const sortedSemesters = sortSemestersChronologically(response.data || []);
        setSemesterOptions(sortedSemesters);
        // Set first semester as default (latest semester)
        if (sortedSemesters.length > 0 && !selectedSemester) {
          setSelectedSemester(sortedSemesters[0].semester);
        }
      } catch (error) {
        console.error('Error fetching semester options:', error);
      }
    };
    fetchSemesterOptions();
  }, []);

  // Fetch pending approvals
  const fetchPendingApprovals = async (page = 1, updateDisplay = true) => {
    if (updateDisplay) setLoading(true);
    setError(null);
    try {
      const storedUserRole = localStorage.getItem("role");
      const userCategory = localStorage.getItem("category");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      
      const requestData = {
        role: storedUserRole,
        category: storedUserRole === "general-secretary" ? userCategory : undefined,
        page,
        limit: 10000
      };

      const response = await axios.post(`${apiUrl}/event/pending/filtered`, requestData);
      
      const applications = response.data?.applications || [];
      setPendingApprovals(applications);
      setPendingCount(response.data?.pagination?.totalCount || applications.length);
      
      if (updateDisplay && activeTab === 'pending') {
        setDisplayApprovals(applications);
        setPagination(response.data?.pagination || {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        });
        const types = Array.from(new Set(applications.map(a => a.eventType).filter(Boolean))).sort();
        setEventTypeOptions(types);
        groupBySemester(applications);
      }

    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      if (updateDisplay) {
        setError("Failed to fetch pending approvals. Please try refreshing the page.");
      }
      setPendingApprovals([]);
      setPendingCount(0);
    } finally {
      if (updateDisplay) setLoading(false);
    }
  };

  // Fetch initiated approvals (all events in pipeline)
  const fetchInitiatedApprovals = async (page = 1, updateDisplay = true) => {
    if (updateDisplay) setLoading(true);
    setError(null);
    try {
      const storedUserRole = localStorage.getItem("role");
      const userCategory = localStorage.getItem("category");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      
      const requestData = {
        role: storedUserRole,
        category: storedUserRole === "general-secretary" ? userCategory : undefined,
        page,
        limit: 10000
      };

      console.log('📤 Fetching initiated approvals with:', requestData);

      const response = await axios.post(`${apiUrl}/event/initiated`, requestData);
      
      console.log('📥 Response received:', response.data);

      const applications = response.data?.applications || [];
      setInitiatedApprovals(applications);
      setInitiatedCount(response.data?.pagination?.totalCount || applications.length);
      
      if (updateDisplay && activeTab === 'initiated') {
        setDisplayApprovals(applications);
        setPagination(response.data?.pagination || {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        });
        const types = Array.from(new Set(applications.map(a => a.eventType).filter(Boolean))).sort();
        setEventTypeOptions(types);
        groupBySemester(applications);
      }

    } catch (error) {
      console.error("Error fetching initiated approvals:", error);
      if (updateDisplay) {
        setError("Failed to fetch initiated approvals. Please try refreshing the page.");
      }
      setInitiatedApprovals([]);
      setInitiatedCount(0);
    } finally {
      if (updateDisplay) setLoading(false);
    }
  };

  // Initial fetch - load both tabs' data for counts
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      // Fetch both tabs in parallel
      await Promise.all([
        fetchInitiatedApprovals(1, activeTab === 'initiated'),
        fetchPendingApprovals(1, activeTab === 'pending')
      ]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []); // Run only once on mount

  // Fetch data when tab or page changes
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingApprovals(currentPage);
    } else if (activeTab === 'initiated') {
      fetchInitiatedApprovals(currentPage);
    }
  }, [activeTab, currentPage]);

  // Group by semester helper
  const groupBySemester = (list) => {
    if (!Array.isArray(list)) {
      setGroupedDisplay({});
      return;
    }
    
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

  // Filtering logic
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      const sourceData = activeTab === 'pending' ? pendingApprovals : initiatedApprovals;
      
      // Ensure sourceData is an array
      if (!Array.isArray(sourceData)) {
        setDisplayApprovals([]);
        groupBySemester([]);
        return;
      }
      
      let result = [...sourceData];

      if (selectedSemester) result = result.filter(e => e.semester === selectedSemester);
      if (selectedAcademicYear) result = result.filter(e => e.academicYear === selectedAcademicYear);
      if (eventTypeFilter) result = result.filter(e => e.eventType === eventTypeFilter);
      
      if (statusFilter && activeTab === 'pending') {
        result = result.filter(e => {
          const myStatus = e.approvals?.find(a => a.role === userRole)?.status || 'Pending';
          return myStatus === statusFilter;
        });
      }

      if (searchTerm.trim()) {
        const s = searchTerm.trim().toLowerCase();
        result = result.filter(e => 
          e.eventName?.toLowerCase().includes(s) ||
          e.nameOfTheOrganizer?.toLowerCase().includes(s) ||
          e.eventVenue?.toLowerCase().includes(s) ||
          e.referenceNumber?.toLowerCase().includes(s)
        );
      }

      // Apply sorting
      switch (sortOrder) {
        case 'oldest':
          result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
          break;
        case 'name-az':
          result.sort((a, b) => (a.eventName || '').localeCompare(b.eventName || ''));
          break;
        case 'name-za':
          result.sort((a, b) => (b.eventName || '').localeCompare(a.eventName || ''));
          break;
        case 'reference-az':
          result.sort((a, b) => (a.referenceNumber || "").localeCompare(b.referenceNumber || ""));
          break;
        case 'reference-za':
          result.sort((a, b) => (b.referenceNumber || "").localeCompare(a.referenceNumber || ""));
          break;
        default:
          result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
          break;
      }
      
      setDisplayApprovals(result);
      groupBySemester(result);

    }, 300);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm, selectedSemester, selectedAcademicYear, statusFilter, eventTypeFilter, sortOrder, pendingApprovals, initiatedApprovals, userRole, activeTab]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const clearFilters = () => {
    setSelectedSemester('');
    setSelectedAcademicYear('');
    setSearchTerm('');
    setStatusFilter('');
    setEventTypeFilter('');
    setSortOrder('newest');
  };

  const handleNextSemester = () => {
    // Next = move backwards in array (to more recent/newer semesters)
    if (!semesterOptions || semesterOptions.length === 0) return;
    const currentIndex = semesterOptions.findIndex(opt => opt.semester === selectedSemester);
    if (currentIndex > 0) {
      setSelectedSemester(semesterOptions[currentIndex - 1].semester);
    }
  };

  const handlePreviousSemester = () => {
    // Previous = move forward in array (to older semesters)
    if (!semesterOptions || semesterOptions.length === 0) return;
    const currentIndex = semesterOptions.findIndex(opt => opt.semester === selectedSemester);
    if (currentIndex < semesterOptions.length - 1) {
      setSelectedSemester(semesterOptions[currentIndex + 1].semester);
    }
  };

  const currentSemesterIndex = semesterOptions && semesterOptions.length > 0 ? semesterOptions.findIndex(opt => opt.semester === selectedSemester) : 0;

  // Handle status update (approve/reject/query)
  const handleStatusUpdate = async () => {
    if (!approvalAction || !selectedApplication) return;
    
    const { _id: applicationId } = selectedApplication;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      
      if (approvalAction === "Query") {
        await axios.post(`${apiUrl}/event/raise-query`, {
          applicationId, role: userRole, queryText: comment
        });
        
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

      } else {
        await axios.patch(`${apiUrl}/event/${applicationId}/status`, {
          applicationId, role: userRole, status: approvalAction, comment
        });
        
        setPendingApprovals(prev => prev.filter(app => app._id !== applicationId));
      }
      
      // Refresh both tabs' data to update counts
      await Promise.all([
        fetchInitiatedApprovals(currentPage, activeTab === 'initiated'),
        fetchPendingApprovals(currentPage, activeTab === 'pending')
      ]);
      
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status. Please try again.");
    } finally {
      handleModalCancel();
    }
  };

  const handleApprovalClick = (application, action) => {
    setSelectedApplication(application);
    setApprovalAction(action);
    setShowModal(true);
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setComment("");
    setApprovalAction(null);
    setSelectedApplication(null);
  };
  
  const handleViewDetails = (eventId) => {
    navigate(`/event-details/${eventId}`);
  };

  const getActionLabel = (action) => {
    const userRole = localStorage.getItem("role");
    switch (action) {
      case "Approved": return userRole === 'dean' ? "Approve" : "Recommend";
      case "Rejected": return "Reject";
      case "Query": return "Raise Query";
      default: return "Confirm Action";
    }
  };

  // Get current status in hierarchy for initiated tab
  const getCurrentHierarchyStatus = (approvals) => {
    if (!Array.isArray(approvals)) return "Unknown Status";
    
    const hierarchy = [
      "club-secretary",
      "general-secretary",
      "treasurer",
      "president",
      "ARSW",
      "associate-dean",
      "associate-dean-socio-cultural",
      "dean"
    ];

    for (let role of hierarchy) {
      const approval = approvals.find(a => a.role === role);
      if (approval && approval.status === "Pending") {
        return `Pending at ${role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
      }
      if (approval && approval.status === "Query") {
        return `Query raised by ${role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
      }
      if (approval && approval.status === "Rejected") {
        return `Rejected by ${role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
      }
    }
    
    return "Fully Approved";
  };

  // Render event card as table row
  const renderEventCard = (approval) => {
    const myApproval = approval.approvals?.find(app => app.role === userRole);
    const myStatus = myApproval?.status || "Pending";
    const isInitiatedTab = activeTab === 'initiated';
    const hierarchyStatus = getCurrentHierarchyStatus(approval.approvals);
    
    // Check if ANY role in the approval chain has rejected the event
    const isRejected = approval.approvals?.some(app => app.status === "Rejected");
    
    // Use 'Rejected' status if any rejection exists, otherwise use personal status
    const displayStatus = isRejected ? 'Rejected' : myStatus;

    return (
      <tr key={approval._id} className={`event-row ${displayStatus.toLowerCase()}`} onClick={() => handleViewDetails(approval._id)}>
        <td className="event-name">{approval.eventName || "Untitled Event"}</td>
        <td className="event-date">{new Date(approval.startDate).toLocaleDateString()}</td>
        <td className="event-status">
          {isInitiatedTab ? (
            <span style={{fontSize: '0.85rem'}}>{hierarchyStatus}</span>
          ) : (
            <span style={{fontWeight: 'bold', color: getStatusColor(displayStatus)}}>{displayStatus}</span>
          )}
        </td>
        <td className="event-ref">{approval.referenceNumber || "Not Applicable"}</td>
      </tr>
    );
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return '#198754';
      case 'Rejected': return '#dc3545';
      case 'Pending': return '#ffc107';
      case 'Query': return '#0dcaf0';
      default: return '#666';
    }
  };
  
  return (
    <Container fluid className="list-of-leaves py-4">
      <h2 className="mb-4">Event Applications</h2>
      
      {/* Tab Navigation */}
      <div className="tabs-section mb-4">
        <div className="btn-group w-100" role="group">
          <button
            type="button"
            className={`btn ${activeTab === 'initiated' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setActiveTab('initiated');
              setCurrentPage(1);
            }}
          >
            Initiated ({initiatedCount})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={() => {
              setActiveTab('pending');
              setCurrentPage(1);
            }}
          >
            Pending My Action ({pendingCount})
          </button>
        </div>
      </div>
      
      {/* Filter Controls Section */}
      <div className="filters-section mb-4 p-3 border rounded bg-light">
        <h5 className="mb-3">Filter Events</h5>
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
          {activeTab === 'pending' && (
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
          )}
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
                <option value="reference-az">Reference # A-Z</option>
                <option value="reference-za">Reference # Z-A</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg={4} md={6}>
            <Form.Group>
              <Form.Label>Search</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search by name, organizer, venue, reference..."
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
                {activeTab === 'pending' && (
                  <Badge bg="warning" text="dark">
                    Pending My Action: {displayApprovals.filter(a => (a.approvals?.find(ap => ap.role === userRole)?.status || 'Pending') === 'Pending').length}
                  </Badge>
                )}
            </Col>
        </Row>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" /> 
          <span className="ms-2">Loading Applications...</span>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center">{error}</div>
      ) : (
        <>
          <h4 className="mb-3">{selectedSemester || activeTab === 'pending' ? 'Pending Approvals' : 'Initiated Events'} - {selectedSemester || 'All Semesters'}</h4>
          {Object.keys(groupedDisplay).length > 0 && selectedSemester && groupedDisplay[selectedSemester] ? (
            <table className="events-table mb-4">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Reference No</th>
                </tr>
              </thead>
              <tbody>
                {groupedDisplay[selectedSemester].map(renderEventCard)}
              </tbody>
            </table>
          ) : (
            <div className="alert alert-info text-center mt-4">
              No event applications match your criteria for the selected semester.
            </div>
          )}
          <div className="semester-navigation mt-4 mb-4 d-flex justify-content-center gap-2">
            <Button 
              variant="outline-primary" 
              onClick={handleNextSemester}
              disabled={currentSemesterIndex <= 0}
              title="Next semester (newer)"
            >
              Next Semester →
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={handlePreviousSemester}
              disabled={currentSemesterIndex >= semesterOptions.length - 1}
              title="Previous semester (older)"
            >
              ← Previous Semester
            </Button>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
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