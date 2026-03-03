import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../StaffDashboard/ProcessedEventApplications.css';
import {
  Card, Container, Row, Col, Form, Button,
  InputGroup, Accordion, Badge, Modal
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const SWOEvents = () => {
  const [approvedEvents, setApprovedEvents]       = useState([]);
  const [initiatedEvents, setInitiatedEvents]     = useState([]);
  const [closedEvents, setClosedEvents]           = useState([]);
  const [displayApproved, setDisplayApproved]     = useState([]);
  const [displayInitiated, setDisplayInitiated]   = useState([]);
  const [displayClosed, setDisplayClosed]         = useState([]);
  const [groupedApproved, setGroupedApproved]     = useState({});
  const [groupedInitiated, setGroupedInitiated]   = useState({});
  const [groupedClosed, setGroupedClosed]         = useState({});

  const [semesterOptions, setSemesterOptions]     = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState(null);
  const [activeTab, setActiveTab]                 = useState('approved');

  // Filters
  const [selectedSemester, setSelectedSemester]           = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear]   = useState('');
  const [searchTerm, setSearchTerm]                       = useState('');
  const [eventTypeFilter, setEventTypeFilter]             = useState('');
  const [sortOrder, setSortOrder]                         = useState('newest');
  const [eventTypeOptions, setEventTypeOptions]           = useState([]);

  // Pagination – approved
  const [currentPage, setCurrentPage]   = useState(1);
  const [pagination, setPagination]     = useState({});

  // Pagination – initiated
  const [initiatedPage, setInitiatedPage]             = useState(1);
  const [initiatedPagination, setInitiatedPagination] = useState({});

  // Query modal
  const [queryModal, setQueryModal]       = useState({ show: false, eventId: null, eventName: '' });
  const [queryText, setQueryText]         = useState('');
  const [queryLoading, setQueryLoading]   = useState(false);

  // Close modal
  const [closeModal, setCloseModal]       = useState({ show: false, eventId: null, eventName: '' });
  const [closeLoading, setCloseLoading]   = useState(false);

  const searchDebounceRef = useRef(null);
  const navigate          = useNavigate();

  const apiUrl   = import.meta.env.VITE_API_URL || 'http://localhost:4001';
  const userID   = localStorage.getItem('userID');
  const userName = localStorage.getItem('user-info')
    ? JSON.parse(localStorage.getItem('user-info')).name
    : 'SW Office';

  // ── Semester options ─────────────────────────────────────────
  useEffect(() => {
    const fetchSemesterOptions = async () => {
      try {
        const res = await axios.get(`${apiUrl}/event/semesters/options`);
        setSemesterOptions(res.data);
      } catch (err) {
        console.error('Error fetching semester options:', err);
      }
    };
    fetchSemesterOptions();
  }, []);

  // ── Fetch helpers ────────────────────────────────────────────
  const fetchApproved = async (page = 1) => {
    try {
      const res = await axios.post(`${apiUrl}/event/swo/approved-events`, {
        semester:     selectedSemester   || undefined,
        academicYear: selectedAcademicYear || undefined,
        search:       searchTerm         || undefined,
        page,
        limit: 10,
      });
      setApprovedEvents(res.data.applications);
      setDisplayApproved(res.data.applications);
      setGroupedApproved(groupBySemester(res.data.applications));
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching approved events:', err);
    }
  };

  const fetchInitiated = async (page = 1) => {
    try {
      const res = await axios.post(`${apiUrl}/event/swo/initiated-events`, {
        semester:     selectedSemester   || undefined,
        academicYear: selectedAcademicYear || undefined,
        search:       searchTerm         || undefined,
        page,
        limit: 10,
      });
      setInitiatedEvents(res.data.applications);
      setDisplayInitiated(res.data.applications);
      setGroupedInitiated(groupBySemester(res.data.applications));
      setInitiatedPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching initiated events:', err);
    }
  };

  const fetchClosed = async () => {
    try {
      const res = await axios.post(`${apiUrl}/event/closed`, {
        role: 'students-welfare-office',
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setClosedEvents(data);
      setDisplayClosed(data);
      setGroupedClosed(groupBySemester(data));
    } catch (err) {
      console.error('Error fetching closed events:', err);
    }
  };

  const fetchAll = async (aPage = 1, iPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchApproved(aPage), fetchInitiated(iPage), fetchClosed()]);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep event type options in sync once data loads
  useEffect(() => {
    const types = [...new Set([
      ...approvedEvents.map(a => a.eventType),
      ...initiatedEvents.map(a => a.eventType),
      ...closedEvents.map(a => a.eventType),
    ].filter(Boolean))].sort();
    setEventTypeOptions(types);
  }, [approvedEvents, initiatedEvents, closedEvents]);

  // ── Grouping helper ──────────────────────────────────────────
  const groupBySemester = (list) =>
    list.reduce((groups, app) => {
      const key = app.semester || `${app.academicYear} Academic Year`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(app);
      return groups;
    }, {});

  // ── Client-side filter + sort ────────────────────────────────
  const applyFilters = () => {
    const run = (source, setDisplay, setGrouped) => {
      let result = [...source];
      if (selectedSemester)     result = result.filter(e => e.semester    === selectedSemester);
      if (selectedAcademicYear) result = result.filter(e => e.academicYear === selectedAcademicYear);
      if (eventTypeFilter)      result = result.filter(e => e.eventType   === eventTypeFilter);
      if (searchTerm.trim()) {
        const s = searchTerm.trim().toLowerCase();
        result = result.filter(e =>
          e.eventName?.toLowerCase().includes(s) ||
          e.nameOfTheOrganizer?.toLowerCase().includes(s) ||
          e.eventVenue?.toLowerCase().includes(s) ||
          e.eventType?.toLowerCase().includes(s) ||
          e.semester?.toLowerCase().includes(s)
        );
      }
      switch (sortOrder) {
        case 'oldest':  result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)); break;
        case 'name-az': result.sort((a, b) => a.eventName.localeCompare(b.eventName)); break;
        case 'name-za': result.sort((a, b) => b.eventName.localeCompare(a.eventName)); break;
        default:        result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      }
      setDisplay(result);
      setGrouped(groupBySemester(result));
    };
    run(approvedEvents,  setDisplayApproved,  setGroupedApproved);
    run(initiatedEvents, setDisplayInitiated, setGroupedInitiated);
    run(closedEvents,    setDisplayClosed,    setGroupedClosed);
  };

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => applyFilters(), 350);
    return () => clearTimeout(searchDebounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedSemester, selectedAcademicYear, eventTypeFilter, sortOrder,
      approvedEvents, initiatedEvents, closedEvents]);

  const clearFilters = () => {
    setSelectedSemester('');
    setSelectedAcademicYear('');
    setSearchTerm('');
    setEventTypeFilter('');
    setSortOrder('newest');
  };

  // ── Actions ──────────────────────────────────────────────────
  const submitQuery = async () => {
    if (!queryText.trim()) return;
    setQueryLoading(true);
    try {
      await axios.post(`${apiUrl}/event/raise-query-approved`, {
        eventId: queryModal.eventId,
        userID,
        queryText,
      });
      setQueryModal({ show: false, eventId: null, eventName: '' });
      setQueryText('');
      fetchApproved(currentPage);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to raise query.');
    } finally {
      setQueryLoading(false);
    }
  };

  const submitClose = async () => {
    setCloseLoading(true);
    try {
      await axios.patch(`${apiUrl}/event/close`, {
        eventId:    closeModal.eventId,
        userID,
        closerName: userName,
      });
      setCloseModal({ show: false, eventId: null, eventName: '' });
      fetchApproved(currentPage);
      fetchClosed();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to close event.');
    } finally {
      setCloseLoading(false);
    }
  };

  // ── Rendering helpers ────────────────────────────────────────
  const getOverallStatus = (approvals = []) => {
    if (approvals.some(a => a.status === 'Rejected')) return 'Rejected';
    if (approvals.some(a => a.status === 'Query'))    return 'Query';
    if (approvals.every(a => a.status === 'Approved')) return 'Approved';
    return 'Pending';
  };

  const renderApprovalChain = (approvals = []) => (
    <div className="mt-2 d-flex flex-wrap gap-1">
      {approvals.map((a, i) => {
        const variant =
          a.status === 'Approved' ? 'success' :
          a.status === 'Rejected' ? 'danger'  :
          a.status === 'Query'    ? 'warning'  : 'secondary';
        return (
          <Badge key={i} bg={variant} title={a.comment || ''} style={{ fontSize: '0.7rem' }}>
            {a.role}: {a.status}
          </Badge>
        );
      })}
    </div>
  );

  // Card for APPROVED events – Raise Query + Close Event
  const renderApprovedCard = (app) => (
    <Col md={6} key={app._id}>
      <Card className="dashboard-card mb-4 approved">
        <Card.Body>
          <Card.Title
            style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
            onClick={() => navigate(`/event-details/${app._id}`)}
          >
            {app.eventName}
          </Card.Title>
          <Card.Text as="div">
            <small>
              <strong>Club:</strong> {app.clubName}&nbsp;|&nbsp;<strong>Type:</strong> {app.eventType}<br />
              <strong>Organizer:</strong> {app.nameOfTheOrganizer}<br />
              <strong>Venue:</strong> {app.eventVenue}<br />
              <strong>Date:</strong> {new Date(app.startDate).toLocaleDateString()} – {new Date(app.endDate).toLocaleDateString()}<br />
              <strong>Semester:</strong> {app.semester || 'N/A'}
            </small>
            {renderApprovalChain(app.approvals)}
          </Card.Text>
          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/event-details/${app._id}`)}>
              View Details
            </Button>
            <Button
              size="sm"
              variant="outline-warning"
              onClick={() => { setQueryText(''); setQueryModal({ show: true, eventId: app._id, eventName: app.eventName }); }}
            >
              Raise Query
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => setCloseModal({ show: true, eventId: app._id, eventName: app.eventName })}
            >
              Close Event
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  // Card for IN-PROGRESS events – view only, NO action buttons
  const renderInitiatedCard = (app) => (
    <Col md={6} key={app._id}>
      <Card className="dashboard-card mb-4 pending">
        <Card.Body>
          <Card.Title
            style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
            onClick={() => navigate(`/event-details/${app._id}`)}
          >
            {app.eventName}
          </Card.Title>
          <Card.Text as="div">
            <small>
              <strong>Club:</strong> {app.clubName}&nbsp;|&nbsp;<strong>Type:</strong> {app.eventType}<br />
              <strong>Organizer:</strong> {app.nameOfTheOrganizer}<br />
              <strong>Venue:</strong> {app.eventVenue}<br />
              <strong>Date:</strong> {new Date(app.startDate).toLocaleDateString()} – {new Date(app.endDate).toLocaleDateString()}<br />
              <strong>Semester:</strong> {app.semester || 'N/A'}<br />
              <strong>Status:</strong> {getOverallStatus(app.approvals)}
            </small>
            {renderApprovalChain(app.approvals)}
          </Card.Text>
          {/* View only – no approve/reject/query buttons */}
          <div className="mt-3">
            <Button size="sm" variant="outline-secondary" onClick={() => navigate(`/event-details/${app._id}`)}>
              View Details
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  // Card for CLOSED events – view only
  const renderClosedCard = (app) => (
    <Col md={6} key={app._id}>
      <Card className="dashboard-card mb-4" style={{ borderColor: '#6c757d' }}>
        <Card.Body>
          <Card.Title
            style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
            onClick={() => navigate(`/event-details/${app._id}`)}
          >
            {app.eventName}
          </Card.Title>
          <Card.Text as="div">
            <small>
              <strong>Club:</strong> {app.clubName}&nbsp;|&nbsp;<strong>Type:</strong> {app.eventType}<br />
              <strong>Organizer:</strong> {app.nameOfTheOrganizer}<br />
              <strong>Venue:</strong> {app.eventVenue}<br />
              <strong>Date:</strong> {new Date(app.startDate).toLocaleDateString()} – {new Date(app.endDate).toLocaleDateString()}<br />
              <strong>Closed By:</strong> {app.closedBy || 'N/A'}&nbsp;|&nbsp;
              <strong>Closed On:</strong> {app.closedAt ? new Date(app.closedAt).toLocaleDateString() : 'N/A'}
            </small>
          </Card.Text>
          <div className="mt-3">
            <Button size="sm" variant="outline-secondary" onClick={() => navigate(`/event-details/${app._id}`)}>
              View Details
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  const renderGrouped = (grouped, renderCard, emptyMsg) => (
    Object.keys(grouped).length > 0 ? (
      <Accordion defaultActiveKey="0" className="mb-4">
        {Object.entries(grouped).map(([sem, events], idx) => (
          <Accordion.Item eventKey={idx.toString()} key={sem}>
            <Accordion.Header>
              {sem} ({events.length} event{events.length !== 1 ? 's' : ''})
            </Accordion.Header>
            <Accordion.Body>
              <Row>{events.map(renderCard)}</Row>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    ) : (
      <p className="text-muted">{emptyMsg}</p>
    )
  );

  const renderPagination = (pag, page, onPageChange) =>
    pag.totalPages > 1 && (
      <div className="d-flex justify-content-center mb-4 gap-3 align-items-center">
        <Button variant="outline-primary" disabled={!pag.hasPrev} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="align-self-center">Page {pag.currentPage} of {pag.totalPages}</span>
        <Button variant="outline-primary" disabled={!pag.hasNext} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    );

  // ─────────────────────────────────────────────────────────────
  return (
    <Container className="dashboard-container">

      {/* ── Tabs ── */}
      <div className="tabs-section mb-4">
        <div className="btn-group w-100" role="group">
          <button
            type="button"
            className={`btn ${activeTab === 'approved'  ? 'btn-primary'           : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({displayApproved.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'initiated' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
            onClick={() => setActiveTab('initiated')}
          >
            In-Progress ({displayInitiated.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'closed'    ? 'btn-secondary'         : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('closed')}
          >
            Closed ({displayClosed.length})
          </button>
        </div>
      </div>

      {/* ── Contextual alerts ── */}
      {activeTab === 'approved' && (
        <div className="alert alert-info py-2 mb-3" role="alert" style={{ fontSize: '0.875rem' }}>
          ℹ️ You can raise post-approval queries or close fully approved events from this tab.
        </div>
      )}
      {activeTab === 'initiated' && (
        <div className="alert alert-warning py-2 mb-3" role="alert" style={{ fontSize: '0.875rem' }}>
          👁️ These events are currently in the approval pipeline. <strong>View details only</strong> — no approval actions are available.
        </div>
      )}

      {/* ── Filters ── */}
      <div className="filters-section mb-4 p-3 border rounded">
        <h5>Filter Events</h5>
        <Row className="g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Semester</Form.Label>
              <Form.Select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                <option value="">All Semesters</option>
                {semesterOptions.map((opt, i) => (
                  <option key={i} value={opt.semester}>{opt.display}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Academic Year</Form.Label>
              <Form.Select value={selectedAcademicYear} onChange={e => setSelectedAcademicYear(e.target.value)}>
                <option value="">All Years</option>
                {[...new Set(semesterOptions.map(o => o.academicYear))].map((yr, i) => (
                  <option key={i} value={yr}>{yr}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label>Event Type</Form.Label>
              <Form.Select value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {eventTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label>Sort</Form.Label>
              <Form.Select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name-az">Name A–Z</option>
                <option value="name-za">Name Z–A</option>
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
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Form.Group>
          </Col>
          <Col md={2} className="d-flex gap-2 align-items-end">
            <Button variant="outline-danger" className="w-100" onClick={clearFilters}>Reset</Button>
          </Col>
          <Col md={12} className="mt-2 d-flex flex-wrap gap-2">
            <Badge bg="primary">Approved: {displayApproved.length}</Badge>
            <Badge bg="warning" text="dark">In-Progress: {displayInitiated.length}</Badge>
            <Badge bg="secondary">Closed: {displayClosed.length}</Badge>
          </Col>
        </Row>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          {activeTab === 'approved' && (
            <>
              <h2>Approved Event Applications</h2>
              {renderGrouped(groupedApproved, renderApprovedCard, 'No approved events found.')}
              {renderPagination(pagination, currentPage, (p) => { setCurrentPage(p); fetchApproved(p); })}
            </>
          )}

          {activeTab === 'initiated' && (
            <>
              <h2>In-Progress Event Applications</h2>
              {renderGrouped(groupedInitiated, renderInitiatedCard, 'No in-progress events found.')}
              {renderPagination(initiatedPagination, initiatedPage, (p) => { setInitiatedPage(p); fetchInitiated(p); })}
            </>
          )}

          {activeTab === 'closed' && (
            <>
              <h2>Closed Event Applications</h2>
              {renderGrouped(groupedClosed, renderClosedCard, 'No closed events found.')}
            </>
          )}
        </>
      )}

      {/* ── Raise Query Modal ── */}
      <Modal show={queryModal.show} onHide={() => setQueryModal({ show: false, eventId: null, eventName: '' })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Raise Post-Approval Query</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>
            Event: <strong>{queryModal.eventName}</strong>
          </p>
          <Form.Group>
            <Form.Label>Query</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Enter your query..."
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setQueryModal({ show: false, eventId: null, eventName: '' })}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitQuery} disabled={queryLoading || !queryText.trim()}>
            {queryLoading ? 'Submitting…' : 'Submit Query'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Close Event Modal ── */}
      <Modal show={closeModal.show} onHide={() => setCloseModal({ show: false, eventId: null, eventName: '' })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Close Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to close <strong>{closeModal.eventName}</strong>?</p>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            This marks the event as officially completed. The event must have already ended.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCloseModal({ show: false, eventId: null, eventName: '' })}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submitClose} disabled={closeLoading}>
            {closeLoading ? 'Closing…' : 'Confirm Close'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default SWOEvents;
