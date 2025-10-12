import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Use useNavigate hook
import axios from "axios";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "./EventDetails.css";

import { generatePDF } from "../../utils/pdfGenerator";

const EventDetails = () => {
  const { id } = useParams(); // Extract event ID from the route params
  const [eventDetails, setEventDetails] = useState(null); // State for event data
  const [isPDFGenerated, setIsPDFGenerated] = useState(false); // State for PDF visibility
  const [isLoading, setIsLoading] = useState(true); // State for loading indicator
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState("");
  const [approvalAction, setApprovalAction] = useState(null);
  const [queries, setQueries] = useState([]); // State for queries
  const [showQueryModal, setShowQueryModal] = useState(false); // State for query modal
  const [queryResponse, setQueryResponse] = useState(""); // State for query response
  const [selectedQuery, setSelectedQuery] = useState(null); // State for selected query
  const navigate = useNavigate(); // Initialize navigate hook
  const role = localStorage.getItem("role"); // Fetch role from localStorage
  const userEmail =
    localStorage.getItem("email") || localStorage.getItem("userEmail"); // Get user email
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    // Function to fetch event details by ID
    const fetchEventDetails = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
        const response = await axios.get(`${apiUrl}/event/${id}`); // Correct API endpoint
        setEventDetails(response.data); // Update state with the fetched event data
      } catch (error) {
        toast.error("Error fetching event details!"); // Display error toast
        console.error("Error fetching event data:", error);
      } finally {
        setIsLoading(false); // Set loading to false
      }
    };

    // Function to fetch queries for this event
    const fetchQueries = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
        const response = await axios.get(`${apiUrl}/event/${id}/queries`);
        setQueries(response.data.queries || []);
      } catch (error) {
        console.error("Error fetching queries:", error);
      }
    };

    fetchEventDetails(); // Call the fetch function
    fetchQueries(); // Fetch queries as well
  }, [id]); // Dependency array to re-run the effect when `id` changes

  // Helper function to get approvals up to rejection point
  const getApprovalsToDisplay = (approvals) => {
    const roleHierarchy = [
      "club-secretary",
      "general-secretary",
      "treasurer",
      "president",
      "faculty-in-charge",
      "associate-dean",
    ];

    // Find the first rejection in the hierarchy
    const rejectionIndex = approvals.findIndex(
      (approval) => approval.status === "Rejected"
    );

    if (rejectionIndex === -1) {
      // No rejection found, show all approvals
      return approvals;
    }

    // Show approvals up to and including the rejection
    return approvals.slice(0, rejectionIndex + 1);
  };

  // Helper function to check if current user can approve/reject
  const canCurrentUserApprove = (approvals) => {
    const roleHierarchy = [
      "club-secretary",
      "general-secretary",
      "treasurer",
      "president",
      "faculty-in-charge",
      "associate-dean",
    ];

    // If there's a rejection, no one can approve anymore
    const hasRejection = approvals.some(
      (approval) => approval.status === "Rejected"
    );
    if (hasRejection) {
      return false;
    }

    // Check if current user's role has a pending status
    const currentUserApproval = approvals.find(
      (approval) => approval.role === role
    );
    return currentUserApproval && currentUserApproval.status === "Pending";
  };

  const canEditEvent = () => {
    // Only club-secretary who created the event and if general-secretary approval is pending
    return role === "club-secretary";
  };
  // When opening modal, prefill form
  useEffect(() => {
    if (showEditModal && eventDetails) {
      setEditForm({
        eventName: eventDetails.eventName,
        eventType: eventDetails.eventType,
        clubName: eventDetails.clubName,
        startDate: eventDetails.startDate?.slice(0, 10),
        endDate: eventDetails.endDate?.slice(0, 10),
        eventVenue: eventDetails.eventVenue,
        sourceOfBudget: eventDetails.sourceOfBudget,
        estimatedBudget: eventDetails.estimatedBudget,
        nameOfTheOrganizer: eventDetails.nameOfTheOrganizer,
        designation: eventDetails.designation,
        email: eventDetails.email,
        phoneNumber: eventDetails.phoneNumber,
        requirements: eventDetails.requirements?.join(", "),
        eventDescription: eventDetails.eventDescription,
        internalParticipants: eventDetails.internalParticipants,
        externalParticipants: eventDetails.externalParticipants,
        listOfCollaboratingOrganizations:
          eventDetails.listOfCollaboratingOrganizations,
        anyAdditionalAmenities: eventDetails.anyAdditionalAmenities,
      });
    }
  }, [showEditModal, eventDetails]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      await axios.patch(`${apiUrl}/event/edit`, {
        eventId: eventDetails._id,
        userID: localStorage.getItem("userID"),
        updates: {
          ...editForm,
          requirements: editForm.requirements.split(",").map((r) => r.trim()),
        },
      });
      toast.success("Event updated successfully!");
      setShowEditModal(false);
      // Refresh event details
      const response = await axios.get(`${apiUrl}/event/${eventDetails._id}`);
      setEventDetails(response.data);
    } catch (error) {
      toast.error("Failed to update event.");
    }
  };

  const handleStatusUpdate = async (
    applicationId,
    role,
    status,
    comment = ""
  ) => {
    try {
      const userCategory = localStorage.getItem("category"); // Get user's category
      console.log("Sending request with:", {
        applicationId,
        role,
        status,
        comment,
        userCategory,
      }); // Debug log

      if (status === "Query") {
        // Use the raise-query endpoint for queries
        const response = await axios.post(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:4001"
          }/event/raise-query`,
          { applicationId, role, queryText: comment }
        );
        console.log("Query raised successfully:", response.data);
        toast.success("Query raised successfully.");

        // Refresh queries after raising one
        const queriesResponse = await axios.get(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:4001"
          }/event/${applicationId}/queries`
        );
        setQueries(queriesResponse.data.queries || []);

        // Refresh event details to update approval status
        const eventResponse = await axios.get(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:4001"
          }/event/${applicationId}`
        );
        setEventDetails(eventResponse.data);
      } else {
        // Use the existing endpoint for approve/reject
        const response = await axios.patch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:4001"
          }/event/${applicationId}/status`,
          { applicationId, role, status, comment, userCategory }
        );
        console.log("Response received:", response.data); // Debug log
        toast.success(`Event ${status} successfully.`);
        navigate(-1); // Navigate back to the previous page only for approve/reject
      }
    } catch (error) {
      console.error("Error updating status:", error);
      if (error.response?.status === 403) {
        toast.error(
          error.response.data.message ||
            "You are not authorized to approve this event."
        );
      } else {
        toast.error("Failed to update status. Please try again.");
      }
    }
  };

  const handleApprovalClick = (action) => {
    setApprovalAction(action);
    setShowModal(true);
  };

  const handleModalSubmit = () => {
    if (approvalAction && eventDetails) {
      handleStatusUpdate(eventDetails._id, role, approvalAction, comment);
      setShowModal(false);
      setComment("");
      setApprovalAction(null);
    }
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setComment("");
    setApprovalAction(null);
  };

  const handleQueryReply = (query) => {
    setSelectedQuery(query);
    setQueryResponse("");
    setShowQueryModal(true);
  };

  const handleQueryModalSubmit = async () => {
    if (!queryResponse.trim()) {
      toast.error("Please enter a response");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      await axios.post(`${apiUrl}/event/reply-query`, {
        eventId: id,
        queryId: selectedQuery.queryId,
        response: queryResponse,
        userRole: role,
        userEmail: userEmail,
      });

      toast.success("Query response submitted successfully!");

      // Refresh queries
      const response = await axios.get(`${apiUrl}/event/${id}/queries`);
      setQueries(response.data.queries || []);

      // Refresh event details to update approval status
      const eventResponse = await axios.get(`${apiUrl}/event/${id}`);
      setEventDetails(eventResponse.data);

      setShowQueryModal(false);
      setQueryResponse("");
      setSelectedQuery(null);
    } catch (error) {
      console.error("Error submitting query response:", error);
      toast.error("Failed to submit response. Please try again.");
    }
  };

  const handleQueryModalCancel = () => {
    setShowQueryModal(false);
    setQueryResponse("");
    setSelectedQuery(null);
  };

  const handleGeneratePDF = () => {
    const headerImageURL = "/form_header.png"; // Path to the header image
    generatePDF(eventDetails, headerImageURL);
    setIsPDFGenerated(true); // Show the iframe after PDF is generated
  };

  if (isLoading) return <div>Loading event details...</div>;
  if (!eventDetails) return <div>Error: Event not found.</div>;

  // Determine the action label for the modal
  const getActionLabel = (action) => {
    switch (action) {
      case "Approved":
        return "Approve";
      case "Rejected":
        return "Reject";
      case "Query":
        return "Raise Query";
      default:
        return action;
    }
  };
  const action = getActionLabel(approvalAction);

  return (
    <div className="event-details-container">
      <div className="event-details">
        <h1>Event Details</h1>
      </div>

      {/* Back button next to the event name */}
      <div className="event-details-header">
        <h4>{eventDetails.eventName}</h4>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        {canEditEvent() && (
          <button
            className="btn btn-warning btn-sm ms-2"
            onClick={() => setShowEditModal(true)}
          >
            Edit Event
          </button>
        )}
        {showEditModal && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                minWidth: "400px",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h4>Edit Event Details</h4>
              <div className="form-group mb-2">
                <label>Event Name</label>
                <input
                  className="form-control"
                  name="eventName"
                  value={editForm.eventName || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Part of Gymkhana Calendar</label>
                <select
                  className="form-control"
                  name="partOfGymkhanaCalendar"
                  value={editForm.partOfGymkhanaCalendar || ""}
                  onChange={handleEditChange}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group mb-2">
                <label>Event Type</label>
                <input
                  className="form-control"
                  name="eventType"
                  value={editForm.eventType || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Club Name</label>
                <input
                  className="form-control"
                  name="clubName"
                  value={editForm.clubName || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="startDate"
                  value={editForm.startDate || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>End Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="endDate"
                  value={editForm.endDate || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Event Venue</label>
                <input
                  className="form-control"
                  name="eventVenue"
                  value={editForm.eventVenue || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Source of Budget</label>
                <input
                  className="form-control"
                  name="sourceOfBudget"
                  value={editForm.sourceOfBudget || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Estimated Budget</label>
                <input
                  className="form-control"
                  name="estimatedBudget"
                  value={editForm.estimatedBudget || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Name of the Organizer</label>
                <input
                  className="form-control"
                  name="nameOfTheOrganizer"
                  value={editForm.nameOfTheOrganizer || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Designation</label>
                <input
                  className="form-control"
                  name="designation"
                  value={editForm.designation || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Email</label>
                <input
                  className="form-control"
                  name="email"
                  value={editForm.email || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Phone Number</label>
                <input
                  className="form-control"
                  name="phoneNumber"
                  value={editForm.phoneNumber || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Requirements (comma separated)</label>
                <input
                  className="form-control"
                  name="requirements"
                  value={editForm.requirements || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Any Additional Amenities</label>
                <input
                  className="form-control"
                  name="anyAdditionalAmenities"
                  value={editForm.anyAdditionalAmenities || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Event Description</label>
                <textarea
                  className="form-control"
                  name="eventDescription"
                  value={editForm.eventDescription || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>Internal Participants</label>
                <input
                  className="form-control"
                  name="internalParticipants"
                  value={editForm.internalParticipants || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>External Participants</label>
                <input
                  className="form-control"
                  name="externalParticipants"
                  value={editForm.externalParticipants || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group mb-2">
                <label>List of Collaborating Organizations</label>
                <input
                  className="form-control"
                  name="listOfCollaboratingOrganizations"
                  value={editForm.listOfCollaboratingOrganizations || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="modal-buttons mt-3">
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleEditSubmit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="event-details-content">
        <p>
          <strong>Type:</strong> {eventDetails.eventType}
        </p>
        <p>
          <strong>Club Name:</strong> {eventDetails.clubName}
        </p>
        <p>
          <strong>Start Date:</strong>{" "}
          {new Date(eventDetails.startDate).toLocaleDateString()}
        </p>
        <p>
          <strong>End Date:</strong>{" "}
          {new Date(eventDetails.endDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Venue:</strong> {eventDetails.eventVenue}
        </p>
        <p>
          <strong>Source of Budget:</strong> {eventDetails.sourceOfBudget}
        </p>
        <p>
          <strong>Estimated Budget:</strong> ₹{eventDetails.estimatedBudget}
        </p>

        <h4>Organizer Details</h4>
        <p>
          <strong>Name:</strong> {eventDetails.nameOfTheOrganizer}
        </p>
        <p>
          <strong>Designation:</strong> {eventDetails.designation}
        </p>
        <p>
          <strong>Email:</strong> {eventDetails.email}
        </p>
        <p>
          <strong>Phone Number:</strong> {eventDetails.phoneNumber}
        </p>

        <h4>Requirements</h4>
        <ul>
          {eventDetails.requirements?.map((req, index) => (
            <li key={index}>{req}</li>
          ))}
        </ul>

        <h4>Description</h4>
        <p>{eventDetails.eventDescription}</p>

        <h4>Participants</h4>
        <p>
          <strong>External:</strong> {eventDetails.externalParticipants}
        </p>
        <p>
          <strong>Internal:</strong> {eventDetails.internalParticipants}
        </p>

        {eventDetails.externalParticipants > 0 && (
          <p>
            <strong>Collaborating Organizations:</strong>{" "}
            {eventDetails.listOfCollaboratingOrganizations}
          </p>
        )}

        <h4>Approval Status</h4>
        <table className="table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Status</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {getApprovalsToDisplay(eventDetails.approvals).map(
              (approval, index) => (
                <tr key={index}>
                  <td>{approval.role}</td>
                  <td>{approval.status}</td>
                  <td>{approval.comment || "N/A"}</td>
                </tr>
              )
            )}
          </tbody>
        </table>

        {/* Queries Section */}
        {queries.length > 0 && (
          <>
            <h4>Queries</h4>
            <div className="queries-section">
              {queries.map((query, index) => (
                <div
                  key={query.queryId}
                  className="query-card mb-3 p-3"
                  style={{ border: "1px solid #ddd", borderRadius: "5px" }}
                >
                  <div className="query-header">
                    <strong>Query from {query.askerRole}:</strong>
                    <span className="text-muted ms-2">
                      {new Date(query.raisedAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`badge ms-2 ${
                        query.status === "Pending" ? "bg-warning" : "bg-success"
                      }`}
                    >
                      {query.status}
                    </span>
                  </div>
                  <div className="query-text mt-2">
                    <p>
                      <strong>Query:</strong> {query.queryText}
                    </p>
                  </div>
                  {query.response && (
                    <div className="query-response mt-2">
                      <p>
                        <strong>Response:</strong> {query.response}
                      </p>
                      <small className="text-muted">
                        Responded on:{" "}
                        {new Date(query.answeredAt).toLocaleDateString()}
                      </small>
                    </div>
                  )}
                  {query.status === "Pending" && role === "club-secretary" && (
                    <button
                      className="btn btn-sm btn-primary mt-2"
                      onClick={() => handleQueryReply(query)}
                    >
                      Reply to Query
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Render Approve and Reject buttons only if the role is not 'club-secretary' and user can approve */}
        {role !== "club-secretary" &&
          canCurrentUserApprove(eventDetails.approvals) && (
            <>
              <button
                className="btn btn-success mb-1 me-2"
                onClick={() => handleApprovalClick("Approved")}
              >
                Approve
              </button>
              <button
                className="btn btn-danger mb-1 me-2"
                onClick={() => handleApprovalClick("Rejected")}
              >
                Reject
              </button>
              <button
                className="btn btn-warning mb-1 me-2"
                onClick={() => handleApprovalClick("Query")}
              >
                Raise Query
              </button>
            </>
          )}

        <button className="btn btn-primary mb-1" onClick={handleGeneratePDF}>
          Generate & Preview PDF
        </button>
        {/* Conditionally render the iframe only after generating PDF */}
        {isPDFGenerated && (
          <iframe
            id="pdf-preview"
            className="pdf-preview"
            style={{ width: "100%", height: "500px", border: "none" }}
          ></iframe>
        )}

        {/* Comment Modal */}
        {showModal && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                minWidth: "400px",
                maxWidth: "600px",
              }}
            >
              <h4>{action} Event</h4>
              <p>
                You are about to <strong>{action.toLowerCase()}</strong> this
                event application.
              </p>

              <div className="form-group mb-3">
                <label htmlFor="comment">
                  {approvalAction === "Query"
                    ? "Query Text (Required):"
                    : "Comment (Optional):"}
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
                    approvalAction === "Approved"
                      ? "btn-success"
                      : approvalAction === "Rejected"
                      ? "btn-danger"
                      : "btn-warning"
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

        {/* Query Response Modal */}
        {showQueryModal && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                minWidth: "400px",
                maxWidth: "600px",
              }}
            >
              <h4>Reply to Query</h4>
              {selectedQuery && (
                <div className="mb-3">
                  <p>
                    <strong>Query from {selectedQuery.askerRole}:</strong>
                  </p>
                  <p
                    style={{
                      fontStyle: "italic",
                      background: "#f8f9fa",
                      padding: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    {selectedQuery.queryText}
                  </p>
                </div>
              )}

              <div className="form-group mb-3">
                <label htmlFor="queryResponse">Your Response (Required):</label>
                <textarea
                  id="queryResponse"
                  className="form-control"
                  rows="4"
                  value={queryResponse}
                  onChange={(e) => setQueryResponse(e.target.value)}
                  placeholder="Please provide a detailed response to address the query..."
                  required
                />
                {!queryResponse.trim() && (
                  <small className="text-danger">Response is required</small>
                )}
              </div>

              <div className="modal-buttons">
                <button
                  className="btn btn-secondary me-2 mb-2"
                  onClick={handleQueryModalCancel}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleQueryModalSubmit}
                  disabled={!queryResponse.trim()}
                >
                  Submit Response
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
