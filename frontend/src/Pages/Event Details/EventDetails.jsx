import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Use useNavigate hook
import axios from "axios";
import { toast } from "react-hot-toast";
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
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfPreviewDataUrl, setPdfPreviewDataUrl] = useState("");
  const pdfObjectUrlRef = useRef(null);
  const navigate = useNavigate(); // Initialize navigate hook
  const role = localStorage.getItem("role"); // Fetch role from localStorage
  const userEmail =
    localStorage.getItem("email") || localStorage.getItem("userEmail"); // Get user email
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editHistory, setEditHistory] = useState([]); // State for edit history
  const [showEditHistory, setShowEditHistory] = useState(false); // Toggle for edit history display

  // Add state for budget breakup editing
  const [editBudgetBreakup, setEditBudgetBreakup] = useState([]);
  const [showBudgetEditModal, setShowBudgetEditModal] = useState(false);
  const [proposedBudgetBreakup, setProposedBudgetBreakup] = useState([]);

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

    // Function to fetch edit history
    const fetchEditHistory = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
        const response = await axios.get(`${apiUrl}/event/${id}/edit-history`);
        console.log("Edit History Response:", response.data.editHistory); // Debug log
        setEditHistory(response.data.editHistory || []);
      } catch (error) {
        console.error("Error fetching edit history:", error);
      }
    };

    fetchEventDetails(); // Call the fetch function
    fetchQueries(); // Fetch queries as well
    fetchEditHistory(); // Fetch edit history
  }, [id]); // Dependency array to re-run the effect when `id` changes

  useEffect(() => {
    return () => {
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = null;
      }
    };
  }, []);

  // Helper function to get approvals up to rejection point
  const getApprovalsToDisplay = (approvals) => {
    const roleHierarchy = [
      "club-secretary",
      "general-secretary",
      "treasurer",
      "president",
      "ARSW",
      "associate-dean",
      "dean"
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
      "ARSW",
      "associate-dean",
      "dean"
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
    // Only club-secretary who created the event can edit
    if (role !== "club-secretary") {
      return false;
    }
    
    // Check if there's any pending query
    if (eventDetails && eventDetails.approvals) {
      const hasQuery = eventDetails.approvals.some(
        (approval) => approval.status === "Query"
      );
      
      // If there's a query, allow editing regardless of approvals
      if (hasQuery) {
        return true;
      }
      
      // Check if any role has approved the event
      const hasAnyApproval = eventDetails.approvals.some(
        (approval) => approval.status === "Approved"
      );
      
      // If any role has approved and no query, editing is disabled
      if (hasAnyApproval) {
        return false;
      }
    }
    
    return true;
  };
  // When opening modal, prefill form and budget breakup
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
        // estimatedBudget: eventDetails.estimatedBudget, // REMOVE THIS LINE
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
      // Normalize various possible shapes of budgetBreakup from backend into
      // { label, amount } rows used by the edit modal inputs.
      const normalizeBudget = (budget) => {
        if (!Array.isArray(budget)) return [];
        return budget.map((item) => {
          if (!item) return { label: "", amount: "" };
          // support backend model: { expenseHead, estimatedAmount }
          // support frontend older shape: { label, amount }
          // support other variants: { name, value } or plain numbers/strings
          if (typeof item === "string") {
            return { label: item, amount: "" };
          }

          const label =
            item.expenseHead ?? item.label ?? item.head ?? item.name ?? item.item ?? "";

          const amountRaw =
            item.estimatedAmount ?? item.estimatedBudget ?? item.amount ?? item.value ?? item.cost ?? "";

          return {
            label: String(label || ""),
            amount: amountRaw !== null && amountRaw !== undefined && amountRaw !== "" ? String(amountRaw) : "",
          };
        });
      };

      setEditBudgetBreakup(normalizeBudget(eventDetails.budgetBreakup));
    }
  }, [showEditModal, eventDetails]);

  // Budget breakup handlers
  const handleBudgetBreakupChange = (idx, field, value) => {
    setEditBudgetBreakup(prev =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: field === "amount" ? value.replace(/[^0-9.]/g, "") : value } : item
      )
    );
  };

  const handleAddBudgetBreakup = () => {
    setEditBudgetBreakup(prev => [...prev, { label: "", amount: "" }]);
  };

  const handleRemoveBudgetBreakup = idx => {
    setEditBudgetBreakup(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculate estimated budget from breakup
  const calculatedEstimatedBudget = editBudgetBreakup.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  // Handlers for ARSW/Associate Dean/Dean budget editing
  const canEditBudget = () => {
    return role === "ARSW" || role === "associate-dean" || role === "dean";
  };

  const handleOpenBudgetEditModal = () => {
    // Normalize existing budgetBreakup for proposed editing
    const normalizeBudget = (budget) => {
      if (!Array.isArray(budget)) return [];
      return budget.map((item) => {
        if (typeof item === "string") {
          return { label: item, amount: "" };
        }
        const label =
          item.expenseHead ??
          item.label ??
          item.head ??
          item.name ??
          item.item ??
          "";
        const amountRaw =
          item.estimatedAmount ??
          item.estimatedBudget ??
          item.amount ??
          item.value ??
          item.cost ??
          item.costInRs ??
          "";
        return {
          label: label || "",
          amount:
            amountRaw !== null && amountRaw !== undefined
              ? String(amountRaw)
              : "",
        };
      });
    };

    const normalized = normalizeBudget(eventDetails.budgetBreakup);
    setProposedBudgetBreakup(normalized.length ? normalized : []);
    setShowBudgetEditModal(true);
  };

  const handleProposedBudgetChange = (idx, field, value) => {
    setProposedBudgetBreakup(prev =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: field === "amount" ? value.replace(/[^0-9.]/g, "") : value } : item
      )
    );
  };

  const handleAddProposedBudget = () => {
    setProposedBudgetBreakup(prev => [...prev, { label: "", amount: "" }]);
  };

  const handleRemoveProposedBudget = idx => {
    setProposedBudgetBreakup(prev => prev.filter((_, i) => i !== idx));
  };

  const calculatedProposedBudget = proposedBudgetBreakup.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  const handleBudgetEditSubmit = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      
      // Transform proposed budget to backend shape
      const transformedProposedBudget = proposedBudgetBreakup
        .filter(item => (item.label || "").trim() !== "")
        .map(item => ({
          expenseHead: (item.label || "").trim(),
          estimatedAmount: Number(parseFloat(item.amount)) || 0,
        }));

      await axios.patch(`${apiUrl}/event/edit-budget`, {
        eventId: eventDetails._id,
        role: role,
        proposedBudgetBreakup: transformedProposedBudget,
        proposedEstimatedBudget: calculatedProposedBudget,
      });

      toast.success("Budget edited successfully!");
      setShowBudgetEditModal(false);
      
      // Refresh event details
      const response = await axios.get(`${apiUrl}/event/${eventDetails._id}`);
      setEventDetails(response.data);
    } catch (error) {
      console.error("Budget edit error:", error);
      toast.error("Failed to edit budget.");
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      // Transform editBudgetBreakup into backend schema: { expenseHead, estimatedAmount }
      const transformedBudget = editBudgetBreakup
        .filter(item => (item.label || "").trim() !== "")
        .map(item => ({
          expenseHead: (item.label || "").trim(),
          estimatedAmount: Number(parseFloat(item.amount)) || 0,
        }));

      await axios.patch(`${apiUrl}/event/edit`, {
        eventId: eventDetails._id,
        userID: localStorage.getItem("userID"),
        updates: {
          ...editForm,
          requirements: editForm.requirements
            ? editForm.requirements.split(",").map((r) => r.trim())
            : [],
          budgetBreakup: transformedBudget,
          estimatedBudget: calculatedEstimatedBudget,
        },
      });
      toast.success("Event updated successfully! Query status preserved.");
      setShowEditModal(false);
      // Refresh event details
      const response = await axios.get(`${apiUrl}/event/${eventDetails._id}`);
      setEventDetails(response.data);
      // Refresh edit history
      const historyResponse = await axios.get(`${apiUrl}/event/${eventDetails._id}/edit-history`);
      setEditHistory(historyResponse.data.editHistory || []);
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

  // Close Event functionality
  const [showCloseModal, setShowCloseModal] = useState(false);
  const handleCloseEvent = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      const userID = localStorage.getItem("userID");
      const userName = localStorage.getItem("name") || localStorage.getItem("username");
      
      await axios.patch(`${apiUrl}/event/close`, {
        eventId: id,
        userID: userID,
        closerName: userName
      });

      toast.success("Event closed successfully!");
      
      // Refresh event details
      const response = await axios.get(`${apiUrl}/event/${id}`);
      setEventDetails(response.data);
      
      setShowCloseModal(false);
    } catch (error) {
      console.error("Error closing event:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to close event. Please try again.");
      }
    }
  };

  // Raise query for approved event
  const [showApprovedQueryModal, setShowApprovedQueryModal] = useState(false);
  const [approvedQueryText, setApprovedQueryText] = useState("");
  
  const handleRaiseApprovedQuery = async () => {
    if (!approvedQueryText.trim()) {
      toast.error("Please enter a query");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      const userID = localStorage.getItem("userID");
      
      await axios.post(`${apiUrl}/event/raise-query-approved`, {
        eventId: id,
        userID: userID,
        queryText: approvedQueryText
      });

      toast.success("Query raised successfully!");
      
      // Refresh queries
      const response = await axios.get(`${apiUrl}/event/${id}/queries`);
      setQueries(response.data.queries || []);
      
      setShowApprovedQueryModal(false);
      setApprovedQueryText("");
    } catch (error) {
      console.error("Error raising query:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to raise query. Please try again.");
      }
    }
  };

  // Check if event can be closed
  const canCloseEvent = () => {
    if (!['associate-dean', 'dean', 'ARSW'].includes(role)) return false;
    if (eventDetails.status === 'Closed') return false;
    
    const allApproved = eventDetails.approvals.every(app => app.status === 'Approved');
    if (!allApproved) return false;
    
    const currentDate = new Date();
    const endDate = new Date(eventDetails.endDate);
    const hundredDaysBefore = new Date(endDate);
    hundredDaysBefore.setDate(endDate.getDate() - 100);
    return currentDate > hundredDaysBefore;
  };

  // Check if can raise query on approved event
  const canRaiseApprovedQuery = () => {
    if (!['associate-dean', 'dean', 'ARSW'].includes(role)) return false;
    if (eventDetails.status === 'Closed') return false;
    
    const allApproved = eventDetails.approvals.every(app => app.status === 'Approved');
    return allApproved;
  };

  const handleGeneratePDF = async () => {
    const headerImageURL = "/form_header.png"; // Path to the header image
    try {
      const { blobUrl, dataUrl } = await generatePDF(eventDetails, headerImageURL);

      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
      }

      pdfObjectUrlRef.current = blobUrl;
      setPdfPreviewUrl(blobUrl);
      setPdfPreviewDataUrl(dataUrl);
      setIsPDFGenerated(true); // Show the iframe after PDF is generated
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      toast.error("Unable to generate PDF preview. Please try again.");
    }
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
        {eventDetails.status === 'Closed' && (
          <div className="alert alert-dark mt-2">
            <strong>⛔ Event Closed</strong><br/>
            This event has been officially closed by {eventDetails.closedBy || 'an administrator'} on {eventDetails.closedAt ? new Date(eventDetails.closedAt).toLocaleDateString() : 'N/A'}.
          </div>
        )}
      </div>

      {/* Back button next to the event name */}
      <div className="event-details-header">
        <h4>
          {eventDetails.eventName}
          {eventDetails.status === 'Closed' && (
            <span className="badge bg-dark ms-2">Closed</span>
          )}
        </h4>
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
              {/* Remove Estimated Budget input */}
              {/* Budget Breakup Section */}
              <div className="form-group mb-2">
                <label>Budget Breakup</label>
                {editBudgetBreakup.map((item, idx) => (
                  <div key={idx} className="d-flex mb-2 align-items-center">
                    <input
                      className="form-control me-2"
                      style={{ width: "50%" }}
                      placeholder="Label"
                      value={item.label}
                      onChange={e =>
                        handleBudgetBreakupChange(idx, "label", e.target.value)
                      }
                    />
                    <input
                      className="form-control me-2"
                      style={{ width: "35%" }}
                      placeholder="Amount"
                      type="number"
                      min="0"
                      value={item.amount}
                      onChange={e =>
                        handleBudgetBreakupChange(idx, "amount", e.target.value)
                      }
                    />
                    <button
                      className="btn btn-danger btn-sm"
                      type="button"
                      onClick={() => handleRemoveBudgetBreakup(idx)}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  className="btn btn-outline-primary btn-sm mt-1"
                  type="button"
                  onClick={handleAddBudgetBreakup}
                >
                  Add Item
                </button>
                <div className="mt-2">
                  <strong>Estimated Budget: </strong>
                  ₹{calculatedEstimatedBudget}
                </div>
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

        {/* Show budget breakup if available */}
        {Array.isArray(eventDetails.budgetBreakup) && eventDetails.budgetBreakup.length > 0 && (
          <>
            <h4>Budget Breakup</h4>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Head</th>
                  <th style={{ width: "150px" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {eventDetails.budgetBreakup.map((item, idx) => {
                  const label = item?.expenseHead ?? item?.label ?? item?.name ?? item?.head ?? item ?? "";
                  const amount = item?.estimatedAmount ?? item?.amount ?? item?.value ?? "";
                  return (
                    <tr key={idx}>
                      <td style={{ wordBreak: "break-word" }}>{label || "—"}</td>
                      <td>{amount !== "" && amount !== null && amount !== undefined ? `₹${amount}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {/* Show proposed budget if edited by ARSW/Associate Dean/Dean */}
        {eventDetails.proposedBudgetBreakup && eventDetails.proposedBudgetBreakup.length > 0 && (
          <>
            <h4 className="text-info">Revised Budget (Edited by {eventDetails.budgetEditedBy})</h4>
            <p>
              <strong>Revised Estimated Budget:</strong> ₹{eventDetails.proposedEstimatedBudget}
            </p>
            <table className="table table-sm table-info">
              <thead>
                <tr>
                  <th>Head</th>
                  <th style={{ width: "150px" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {eventDetails.proposedBudgetBreakup.map((item, idx) => {
                  const label = item?.expenseHead ?? item?.label ?? item?.name ?? item?.head ?? "";
                  const amount = item?.estimatedAmount ?? item?.amount ?? item?.value ?? "";
                  return (
                    <tr key={idx}>
                      <td style={{ wordBreak: "break-word" }}>{label || "—"}</td>
                      <td>{amount !== "" && amount !== null && amount !== undefined ? `₹${amount}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-muted small">
              <em>Edited on: {new Date(eventDetails.budgetEditedAt).toLocaleString()}</em>
            </p>
          </>
        )}

        {/* Budget Edit Button for ARSW/Associate Dean/Dean */}
        {canEditBudget() && (
          <button 
            className="btn btn-warning btn-sm mb-3" 
            onClick={handleOpenBudgetEditModal}
          >
            <i className="bi bi-pencil-square"></i> Edit Budget
          </button>
        )}

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

        {/* Edit History Section */}
        {(() => {
          // Filter out edits with no actual changes
          const validEdits = editHistory.filter(edit => edit.changes && Object.keys(edit.changes).length > 0);
          
          if (validEdits.length === 0) return null;
          
          return (
            <>
              <div className="d-flex justify-content-between align-items-center mt-4">
                <h4>Edit History</h4>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowEditHistory(!showEditHistory)}
                >
                  {showEditHistory ? 'Hide History' : 'Show History'}
                </button>
              </div>
              {showEditHistory && (() => {
              console.log("All edits:", editHistory);
              console.log("Valid edits after filter:", validEdits);
              
              if (validEdits.length === 0) {
                return (
                  <div className="edit-history-section mt-3">
                    <p className="text-muted">No edit history available.</p>
                  </div>
                );
              }
              
              return (
                <div className="edit-history-section mt-3">
                  {validEdits.map((edit, index) => {
                    console.log(`Edit #${index}:`, edit, "Changes keys:", Object.keys(edit.changes || {}));
                    return (
                    <div
                      key={index}
                      className="edit-history-card mb-3 p-3"
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        backgroundColor: "#f8f9fa"
                      }}
                    >
                      <div className="edit-header">
                        <strong>Edit #{validEdits.length - index}</strong>
                        <span className="text-muted ms-2">
                          by {edit.editorName} ({edit.editorEmail})
                        </span>
                        <span className="text-muted ms-2">
                          on {new Date(edit.editedAt).toLocaleString()}
                        </span>
                      </div>
                    <div className="edit-changes mt-2">
                      <strong>Changes Made:</strong>
                      {Object.keys(edit.changes || {}).length === 0 ? (
                        <p className="text-muted mt-2">No changes recorded</p>
                      ) : (
                        <table className="table table-sm table-bordered mt-2">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '25%' }}>Field</th>
                              <th style={{ width: '37.5%' }}>Old Value</th>
                              <th style={{ width: '37.5%' }}>New Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(edit.changes || {}).map(([field, change]) => {
                              // Don't render budgetBreakup changes in the table
                              if (field === 'budgetBreakup') return null;
                              // Format values for display
                              const formatValue = (value) => {
                                if (value === null || value === undefined) return "N/A";
                                if (Array.isArray(value)) return value.join(", ");
                                if (typeof value === 'object' && !(value instanceof Date)) return JSON.stringify(value);
                                
                                // Handle date strings and Date objects
                                if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
                                  const date = new Date(value);
                                  if (!isNaN(date.getTime())) {
                                    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                                  }
                                }
                                
                                return String(value);
                              };
                              
                              // Skip date fields if the formatted values are the same
                              const dateFields = ['startDate', 'endDate'];
                              if (dateFields.includes(field)) {
                                const formattedOld = formatValue(change.oldValue);
                                const formattedNew = formatValue(change.newValue);
                                if (formattedOld === formattedNew) {
                                  return null; // Skip this field
                                }
                              }
                              
                              // Format field name for display (camelCase to Title Case)
                              const displayField = field
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase());

                              return (
                                <tr key={field}>
                                  <td><strong>{displayField}</strong></td>
                                  <td style={{ 
                                    color: "#dc3545", 
                                    wordBreak: "break-word",
                                    backgroundColor: "#fff5f5"
                                  }}>
                                    {formatValue(change.oldValue)}
                                  </td>
                                  <td style={{ 
                                    color: "#28a745",
                                    wordBreak: "break-word",
                                    backgroundColor: "#f0fff4"
                                  }}>
                                    {formatValue(change.newValue)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
              );
            })()}
            </>
          );
        })()}

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

        {/* Close Event Button - for associate-dean, dean, ARSW only */}
        {canCloseEvent() && (
          <button 
            className="btn btn-dark mb-1 ms-2" 
            onClick={() => setShowCloseModal(true)}
          >
            Close Event
          </button>
        )}

        {/* Raise Query for Approved Event - for associate-dean, dean, ARSW only */}
        {canRaiseApprovedQuery() && (
          <button 
            className="btn btn-info mb-1 ms-2" 
            onClick={() => setShowApprovedQueryModal(true)}
          >
            Raise Query
          </button>
        )}

        {/* Conditionally render the iframe only after generating PDF */}
        {isPDFGenerated && (
          <>
            <iframe
              id="pdf-preview"
              key={pdfPreviewUrl || pdfPreviewDataUrl}
              className="pdf-preview"
              style={{ width: "100%", height: "500px", border: "none" }}
              src={pdfPreviewUrl || pdfPreviewDataUrl || undefined}
              title="PDF Preview"
            ></iframe>
            {!pdfPreviewUrl && pdfPreviewDataUrl && (
              <p style={{ marginTop: "8px" }}>
                If the preview stays blank, <a href={pdfPreviewDataUrl} target="_blank" rel="noopener noreferrer">open the PDF in a new tab</a>.
              </p>
            )}
          </>
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

        {/* Close Event Modal */}
        {showCloseModal && (
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
              <h4>Close Event</h4>
              <p>
                Are you sure you want to close this event? This action will mark the event as closed
                and send a notification to the organizer.
              </p>
              <div className="alert alert-info">
                <strong>Event:</strong> {eventDetails.eventName}<br/>
                <strong>End Date:</strong> {new Date(eventDetails.endDate).toLocaleDateString()}<br/>
                <strong>Organizer:</strong> {eventDetails.nameOfTheOrganizer}
              </div>

              <div className="modal-buttons">
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => setShowCloseModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-dark"
                  onClick={handleCloseEvent}
                >
                  Close Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Raise Query for Approved Event Modal */}
        {showApprovedQueryModal && (
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
              <h4>Raise Query for Approved Event</h4>
              <p>
                You are raising a query for an approved event. The organizer will be notified
                and can respond through the system.
              </p>

              <div className="form-group mb-3">
                <label htmlFor="approvedQueryText">Query (Required):</label>
                <textarea
                  id="approvedQueryText"
                  className="form-control"
                  rows="4"
                  value={approvedQueryText}
                  onChange={(e) => setApprovedQueryText(e.target.value)}
                  placeholder="Enter your query here..."
                  required
                />
                {!approvedQueryText.trim() && (
                  <small className="text-danger">Query text is required</small>
                )}
              </div>

              <div className="modal-buttons">
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setShowApprovedQueryModal(false);
                    setApprovedQueryText("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-info"
                  onClick={handleRaiseApprovedQuery}
                  disabled={!approvedQueryText.trim()}
                >
                  Submit Query
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Budget Edit Modal for ARSW/Associate Dean/Dean */}
        {showBudgetEditModal && (
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
                minWidth: "600px",
                maxWidth: "800px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h4>Edit Budget Proposal</h4>

              {/* Original Budget Summary */}
              <div className="alert alert-secondary mb-3">
                <h6>Original Budget: ₹{eventDetails.estimatedBudget}</h6>
              </div>

              {/* Proposed Budget Breakup Section */}
              <div className="form-group mb-3">
                <label><strong>Proposed Budget Breakup</strong></label>
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Expense Head</th>
                        <th style={{ width: "150px" }}>Amount (₹)</th>
                        <th style={{ width: "80px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposedBudgetBreakup.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={item.label}
                              onChange={(e) =>
                                handleProposedBudgetChange(idx, "label", e.target.value)
                              }
                              placeholder="e.g. Venue Rental"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={item.amount}
                              onChange={(e) =>
                                handleProposedBudgetChange(idx, "amount", e.target.value)
                              }
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveProposedBudget(idx)}
                            >
                              <i>Remove</i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-success mt-2"
                  onClick={handleAddProposedBudget}
                >
                  <i className="bi bi-plus-circle"></i> Add Expense Head
                </button>

                <div className="mt-3 p-2 bg-light rounded">
                  <strong>Proposed Estimated Budget: </strong>
                  <span className="text-primary">₹{calculatedProposedBudget.toFixed(2)}</span>
                </div>
              </div>

              <div className="modal-buttons mt-3">
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setShowBudgetEditModal(false);
                    setProposedBudgetBreakup([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-warning"
                  onClick={handleBudgetEditSubmit}
                  disabled={proposedBudgetBreakup.length === 0}
                >
                  <i className="bi bi-check-circle"></i> Submit Budget Proposal
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
