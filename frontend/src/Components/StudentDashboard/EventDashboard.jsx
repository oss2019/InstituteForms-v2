import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button, Form, InputGroup, Row, Col, Accordion, Badge, Modal } from "react-bootstrap";
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
  const [userRole, setUserRole] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [deletingEvent, setDeletingEvent] = useState(false);

  useEffect(() => {
    const fetchEventStatus = async () => {
      const userId = localStorage.getItem("userID");
      setUserRole(localStorage.getItem("role") || "");
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
    const sortSemestersChronologically = (semesters) => {
      return [...semesters].sort((a, b) => {
        const [aSeason, aYear] = a.split(' ');
        const [bSeason, bYear] = b.split(' ');
        const aYearNum = parseInt(aYear);
        const bYearNum = parseInt(bYear);
        if (aYearNum !== bYearNum) return bYearNum - aYearNum;
        return aSeason === 'Autumn' ? -1 : 1;
      });
    };
    const semesters = Array.from(new Set(eventsData.map(e => e.semester).filter(Boolean)));
    const sortedSemesters = sortSemestersChronologically(semesters);
    const academicYears = Array.from(new Set(eventsData.map(e => e.academicYear).filter(Boolean))).sort().reverse();
    setSemesterOptions(sortedSemesters);
    setAcademicYearOptions(academicYears);
    // Set first semester as default (latest semester)
    if (sortedSemesters.length > 0 && !selectedSemester) {
      setSelectedSemester(sortedSemesters[0]);
    }
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

  const hasPendingBudgetRevision = (event) => {
    return event.arsw_budget_revisions?.some(r => r.clubSecretaryApprovalStatus === "Pending");
  };

  const hasQueryOnBudgetRevision = (event) => {
    return event.arsw_budget_revisions?.some(r => r.clubSecretaryApprovalStatus === "QueryRaised" && !r.isFinalized);
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
                e.clubName?.toLowerCase().includes(s) ||
                e.referenceNumber?.toLowerCase().includes(s)
            );
        }

        switch (sortOrder) {
            case "oldest": result.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
            case "name-az": result.sort((a,b) => a.eventName.localeCompare(b.eventName)); break;
            case "name-za": result.sort((a,b) => b.eventName.localeCompare(a.eventName)); break;
            case "reference-az": result.sort((a,b) => (a.referenceNumber || "").localeCompare(b.referenceNumber || "")); break;
            case "reference-za": result.sort((a,b) => (b.referenceNumber || "").localeCompare(a.referenceNumber || "")); break;
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

  const handlePreviousSemester = () => {
    const currentIndex = semesterOptions.indexOf(selectedSemester);
    if (currentIndex > 0) {
      setSelectedSemester(semesterOptions[currentIndex - 1]);
    }
  };

  const handleNextSemester = () => {
    const currentIndex = semesterOptions.indexOf(selectedSemester);
    if (currentIndex < semesterOptions.length - 1) {
      setSelectedSemester(semesterOptions[currentIndex + 1]);
    }
  };

  const currentSemesterIndex = semesterOptions.indexOf(selectedSemester);

  const handleViewDetails = (eventId) => navigate(`/event-details/${eventId}`);

  const handleDeleteEvent = (event, application) => {
    event.stopPropagation();
    setDeleteTarget(application._id);
    setDeleteConfirmation("");
    setDeletionReason("");
  };

  const closeDeleteModal = () => {
    if (deletingEvent) return;
    setDeleteTarget(null);
    setDeleteConfirmation("");
    setDeletionReason("");
  };

  const confirmDeleteEvent = async () => {
    if (deleteConfirmation !== "Delete" || !deleteTarget) return;
    setDeletingEvent(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      const userID = localStorage.getItem("userID");
      await axios.delete(`${apiUrl}/event/${deleteTarget}/delete`, {
        data: { role: userRole, userID, deletionReason },
      });
      setEvents((currentEvents) => currentEvents.filter((event) => event._id !== deleteTarget));
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setDeletingEvent(false);
    }
  };

  const renderEventCard = (event) => (
    <tr key={event._id} className={`event-row ${getOverallStatus(event.approvals).toLowerCase()}`} onClick={() => handleViewDetails(event._id)}>
      <td className="event-name">{event.eventName}</td>
      <td className="event-date">{new Date(event.startDate).toLocaleDateString()}</td>
      <td className="event-status">
        <span style={{fontWeight: 'bold', color: getStatusColorWithBudget(event)}}>
          {getDisplayStatus(event)}
        </span>
      </td>
      <td className="event-ref">{event.referenceNumber || "Not Applicable"}</td>
      {["club-secretary", "general-secretary"].includes(userRole) && !["Approved", "Rejected"].includes(getOverallStatus(event.approvals)) && (
        <td style={{ textAlign: "center" }}>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={(clickEvent) => handleDeleteEvent(clickEvent, event)}
          >
            Delete
          </Button>
        </td>
      )}
    </tr>
  );

  const getDisplayStatus = (event) => {
    const baseStatus = getOverallStatus(event.approvals);
    if (hasPendingBudgetRevision(event)) {
      return `${baseStatus} (Budget Review)`;
    }
    if (hasQueryOnBudgetRevision(event)) {
      return `${baseStatus} (Budget Query)`;
    }
    return baseStatus;
  };

  const getStatusColorWithBudget = (event) => {
    if (hasPendingBudgetRevision(event)) {
      return '#dc3545'; // Red for pending budget review
    }
    if (hasQueryOnBudgetRevision(event)) {
      return '#fd7e14'; // Orange for budget query
    }
    return getStatusColor(getOverallStatus(event.approvals));
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
                    placeholder="Search name, club or reference..."
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
                  <option value="reference-az">Reference # A-Z</option>
                  <option value="reference-za">Reference # Z-A</option>
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
            <>
              {selectedSemester && groupedEvents[selectedSemester] ? (
                <>
                  <h3 className="mb-3">{selectedSemester}</h3>
                  <table className="events-table mb-4">
                    <thead>
                      <tr>
                        <th>Event Name</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Reference No</th>
                        {["club-secretary", "general-secretary"].includes(userRole) && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedEvents[selectedSemester].map(renderEventCard)}
                    </tbody>
                  </table>
                </>
              ) : <p>No events found for the selected semester.</p>}
              <div className="semester-navigation mt-4 mb-4 d-flex justify-content-center gap-2">
                <Button 
                  variant="outline-primary" 
                  onClick={handlePreviousSemester}
                  disabled={currentSemesterIndex >= semesterOptions.length - 1}
                  title="Previous semester (older)"
                >
                  ← Previous Semester
                </Button>
                <Button 
                  variant="outline-primary" 
                  onClick={handleNextSemester}
                  disabled={currentSemesterIndex <= 0}
                  title="Next semester (newer)"
                >
                  Next Semester →
                </Button>
              </div>
            </>
          ) : <p>No events found for the selected criteria.</p>}
        </>
      )}

      <Modal show={Boolean(deleteTarget)} onHide={closeDeleteModal} centered>
        <Modal.Header closeButton={!deletingEvent}>
          <Modal.Title>Delete event?</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(event) => {
          event.preventDefault();
          confirmDeleteEvent();
        }}>
          <Modal.Body>
            <p>This permanently deletes the event application and cannot be undone.</p>
            <Form.Group className="mb-3" controlId="club-deletion-reason">
              <Form.Label>Reason for deletion</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={deletionReason}
                onChange={(event) => setDeletionReason(event.target.value)}
                disabled={deletingEvent}
                placeholder="Enter the reason for deleting this event"
              />
            </Form.Group>
            <Form.Group controlId="club-delete-confirmation">
              <Form.Label>Type <strong>Delete</strong> to confirm.</Form.Label>
              <Form.Control
                autoFocus
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                disabled={deletingEvent}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeDeleteModal} disabled={deletingEvent}>
              Cancel
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={deleteConfirmation !== "Delete" || !deletionReason.trim() || deletingEvent}
            >
              {deletingEvent ? "Deleting..." : "Delete permanently"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default EventDashboard;