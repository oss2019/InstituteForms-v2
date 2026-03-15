import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Use useNavigate hook
import axios from "axios";
import { toast } from "react-hot-toast";
import DOMPurify from "dompurify";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import "./EventDetails.css";

import { generatePDF } from "../../utils/pdfGenerator";
import EventForm from "../../Components/EventForm/EventForm";

// Collapsible row for a single budget history entry
const BudgetHistoryEntry = ({ entry, entryNum, roleLabel, isLatest, revision }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div
      className={`budget-entry ${isLatest ? "budget-entry-latest" : ""}`}
    >
      {/* Header with toggle on right */}
      <div className="budget-entry-header-row">
        <div>
          <div className="budget-entry-header">
            <span className="budget-entry-title">
              #{entryNum} · {roleLabel}
            </span>
            {isLatest && (
              <span className="budget-latest-badge">Latest</span>
            )}
          </div>
          <div className="budget-entry-meta">
            ₹{entry.totalBudget.toLocaleString()}
          </div>
          <div className="budget-entry-date">
            {new Date(entry.editedAt).toLocaleString()}
          </div>
        </div>
        <button
          className="budget-toggle-btn"
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? "▲ Hide" : "▼ Breakdown"}
        </button>
      </div>

      {/* Justification */}
      {entry.justification && (
        <div className="budget-entry-justification">
          "{entry.justification}"
        </div>
      )}

      {/* Budget breakdown – shown on expand, full width */}
      {expanded && (
        <div className="budget-breakdown">
          <table className="table table-sm table-bordered mb-0" style={{ fontSize: "0.85rem" }}>
            <thead className="table-light">
              <tr>
                <th>Expense Head</th>
                <th style={{ width: "150px" }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {entry.budgetBreakup.map((item, i) => (
                <tr key={i}>
                  <td>{item.expenseHead}</td>
                  <td>₹{item.estimatedAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-warning fw-semibold">
                <td>Total</td>
                <td>₹{entry.totalBudget.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Club Secretary response as query – Always visible, not hidden */}
      {revision?.clubSecretaryResponse && (
        <div className="budget-entry-query-justification">
          <strong>
            {revision.clubSecretaryApprovalStatus === "Approved" ? "Approved" : "Query"}:
          </strong>{" "}
          {revision.clubSecretaryResponse}
          {revision.respondedAt && (
            <div style={{ fontSize: "0.75rem", marginTop: "4px", color: "#6c757d" }}>
              {new Date(revision.respondedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
  const userID = localStorage.getItem("userID"); // Fetch current user's ID
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
  const [budgetJustification, setBudgetJustification] = useState("");
  const [showBudgetHistory, setShowBudgetHistory] = useState(true);
  const [showAllBudgetHistory, setShowAllBudgetHistory] = useState(false);
  const [showQueries, setShowQueries] = useState(false);
  // Add state for editing additional amenities
  const [editAdditionalAmenities, setEditAdditionalAmenities] = useState([]);

  // Add state for budget revision review (club secretary)
  const [showBudgetRevisionModal, setShowBudgetRevisionModal] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [revisionResponse, setRevisionResponse] = useState("");
  const [revisionResponseType, setRevisionResponseType] = useState("Approved"); // "Approved" or "QueryRaised"

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
    console.log("Approvals:", eventDetails.approvals);
    console.log("Role:", role);

    // If there's a rejection, no one can approve anymore
    const hasRejection = approvals.some(
      (approval) => approval.status === "Rejected"
    );
    if (hasRejection) {
      return false;
    }
    const currentIndex = approvals.findIndex((approval) => approval.role === role);
    if (currentIndex === -1) {return false;} // User's role not in approval hierarchy
    if (approvals[currentIndex].status !== "Pending") {return false;} // Current user's approval is not pending  
    return approvals.slice(0, currentIndex).every(approval => approval.status === "Approved");
    
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

  // Helper function to check if there's a pending budget revision for club secretary
  const getPendingBudgetRevision = () => {
    if (!eventDetails?.arsw_budget_revisions) return null;
    return eventDetails.arsw_budget_revisions.find(r => r.clubSecretaryApprovalStatus === "Pending");
  };

  // Helper function to check if club secretary needs to respond to a query on budget
  const getQueryOnBudgetRevision = () => {
    if (!eventDetails?.arsw_budget_revisions) return null;
    return eventDetails.arsw_budget_revisions.find(r => r.clubSecretaryApprovalStatus === "QueryRaised" && !r.isFinalized);
  };

  // Helper function to get ARSW budget revision with query for display
  const getARSWBudgetQueryRevision = () => {
    if (!eventDetails?.arsw_budget_revisions) return null;
    return eventDetails.arsw_budget_revisions.find(r => r.clubSecretaryApprovalStatus === "QueryRaised" && !r.isFinalized);
  };

  // Helper function to check if ARSW can edit budget after query
  const canARSWEditAfterQuery = () => {
    if (role !== "ARSW") return false;
    const arswApproval = eventDetails?.approvals?.find(a => a.role === "ARSW");
    if (!arswApproval) return false;
    return arswApproval.status === "Query" || arswApproval.status === "Edited";
  };

  // Helper function to check if can take action (reject/query) despite being in edit mode
  const canTakeActionWhenEdited = (approvals) => {
    const currentApproval = approvals.find((approval) => approval.role === role);
    if (!currentApproval) return false;
    // Allow Reject and Query when status is "Edited" or "Query" (after ARSW edits budget)
    return currentApproval.status === "Edited" || currentApproval.status === "Query";
  };

  // Helper function to check if budget revision has been finalized
  const isBudgetFinalized = () => {
    if (!eventDetails?.arsw_budget_revisions) return false;
    const lastRevision = eventDetails.arsw_budget_revisions[eventDetails.arsw_budget_revisions.length - 1];
    return lastRevision && lastRevision.isFinalized;
  };

  // Open budget revision review modal
  const handleOpenBudgetRevisionReview = (revision) => {
    setSelectedRevision(revision);
    setRevisionResponse("");
    setRevisionResponseType("Approved");
    setShowBudgetRevisionModal(true);
  };

  // Handle club secretary's response to budget revision
  const handleRespondToBudgetRevision = async () => {
    if (!selectedRevision) {
      toast.error("No revision selected");
      return;
    }

    if (revisionResponseType === "QueryRaised" && !revisionResponse.trim()) {
      toast.error("Please provide a query/feedback");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
      
      await axios.patch(`${apiUrl}/event/respond-budget-revision`, {
        eventId: eventDetails._id,
        revisionNumber: selectedRevision.revisionNumber,
        status: revisionResponseType,
        response: revisionResponseType === "QueryRaised" ? revisionResponse : ""
      });

      toast.success(`Budget revision ${revisionResponseType === "Approved" ? "approved" : "query raised"} successfully!`);
      setShowBudgetRevisionModal(false);
      
      // Refresh event details
      const response = await axios.get(`${apiUrl}/event/${eventDetails._id}`);
      setEventDetails(response.data);
    } catch (error) {
      console.error("Error responding to budget revision:", error);
      toast.error(error.response?.data?.message || "Failed to respond to budget revision");
    }
  };

  // Auto-show budget revision modal if there's a pending revision and user is club secretary
  useEffect(() => {
    if (eventDetails && role === "club-secretary" && !showBudgetRevisionModal) {
      const pendingRevision = getPendingBudgetRevision();
      if (pendingRevision && !showBudgetRevisionModal) {
        // Only show automatically once - don't block the user from viewing other parts
        // handleOpenBudgetRevisionReview(pendingRevision);
      }
    }
  }, [eventDetails, role, showBudgetRevisionModal]);

  // Helper function to build timeline events
  const buildTimelineEvents = () => {
    const events = [];
    
    // Add event creation
    if (eventDetails?.createdAt) {
      events.push({
        type: "created",
        date: new Date(new Date(eventDetails.createdAt).getTime() - 10000),
        title: "Event Created",
        description: "Event application submitted",
        icon: "⭐",
        color: "#6f42c1"
      });
    }
    
    // Add approval actions
    if (eventDetails?.approvals) {
      eventDetails.approvals.forEach((approval) => {
        const hasTimestamp = approval.timestamp;
        const shouldShowApprovalOrReject = approval.status === "Approved" || approval.status === "Rejected";
        
        // Show only completed actions (Approved/Rejected) - pending items shown separately below
        if (hasTimestamp && shouldShowApprovalOrReject) {
          let title = `${approval.role.replace(/-/g, ' ').replace(/^\//, '').toUpperCase()}`;
          let icon = "";
          let color = "#6c757d";
          let description = approval.comment || "No comments";
          
          if (approval.status === "Approved") {
            title += approval.role === 'dean' ? " Approved" : " Recommended";
            icon = "✓";
            color = "#28a745";
          } else if (approval.status === "Rejected") {
            title += " Rejected";
            icon = "✗";
            color = "#dc3545";
          }
          
          events.push({
            type: "approval",
            date: new Date(approval.timestamp || eventDetails.createdAt),
            title: title,
            description: approval.comment || "No comments",
            icon: icon,
            color: color,
            role: approval.role
          });
        }
      });
    }
    
    // Add query raised from queries array (only if not answered)
    if (eventDetails?.queries) {
      eventDetails.queries.forEach((query) => {
        // Show query raised only if NOT answered
        if (query.raisedAt && !query.answeredAt) {
          events.push({
            type: "query-raised",
            date: new Date(query.raisedAt),
            title: `${query.askerRole.replace(/-/g, ' ').toUpperCase()} Query`,
            description: query.queryText,
            icon: "?",
            color: "#ffc107"
          });
        }
      });
    }

    // Do not add edit history to timeline
    
    // Sort events by date
    return events.sort((a, b) => a.date - b.date);
  };

  // When opening modal, prefill form and budget breakup
  useEffect(() => {
    if (showEditModal && eventDetails) {
      setEditForm({
        eventName: eventDetails.eventName || '',
        partOfGymkhanaCalendar: eventDetails.partOfGymkhanaCalendar || '',
        eventType: eventDetails.eventType || '',
        clubName: eventDetails.clubName || '',
        startDate: eventDetails.startDate ? (eventDetails.startDate.slice(0, 16).includes('T') ? eventDetails.startDate.slice(0, 16) : `${eventDetails.startDate.slice(0, 10)}T00:00`) : '',
        endDate: eventDetails.endDate ? (eventDetails.endDate.slice(0, 16).includes('T') ? eventDetails.endDate.slice(0, 16) : `${eventDetails.endDate.slice(0, 10)}T00:00`) : '',
        eventVenue: eventDetails.eventVenue || '',
        sourceOfBudget: eventDetails.sourceOfBudget || '',
        nameOfTheOrganizer: eventDetails.nameOfTheOrganizer || '',
        designation: eventDetails.designation || '',
        email: eventDetails.email || '',
        phoneNumber: eventDetails.phoneNumber || '',
        requirements: eventDetails.requirements && Array.isArray(eventDetails.requirements) 
          ? eventDetails.requirements
              .filter(r => typeof r === 'string' ? r.trim() : r.name && r.name.trim())
              .map(r => typeof r === 'string' ? r : r.name)
              .join(", ")
          : '',
        eventDescription: eventDetails.eventDescription || '',
        internalParticipants: eventDetails.internalParticipants || '',
        externalParticipants: eventDetails.externalParticipants || '',
        listOfCollaboratingOrganizations: eventDetails.listOfCollaboratingOrganizations || '',
      });

      // Normalize budget breakup
      const normalizeBudget = (budget) => {
        if (!Array.isArray(budget)) return [];
        return budget.map((item) => {
          if (!item) return { label: "", amount: "" };
          if (typeof item === "string") {
            return { label: item, amount: "" };
          }
          const label = item.expenseHead ?? item.label ?? item.head ?? item.name ?? item.item ?? "";
          const amountRaw = item.estimatedAmount ?? item.estimatedBudget ?? item.amount ?? item.value ?? item.cost ?? "";
          return {
            label: String(label || ""),
            amount: amountRaw !== null && amountRaw !== undefined && amountRaw !== "" ? String(amountRaw) : "",
          };
        });
      };

      setEditBudgetBreakup(normalizeBudget(eventDetails.budgetBreakup));

      // Handle additional amenities - normalize to array of objects
      const normalizeAmenities = (amenities) => {
        if (!amenities) return [];
        if (Array.isArray(amenities)) {
          return amenities.filter(a => a && (a.amenityName || a.name)).map(a => ({
            amenityName: a.amenityName || a.name || '',
            description: a.description || ''
          }));
        }
        return [];
      };

      setEditAdditionalAmenities(normalizeAmenities(eventDetails.additionalAmenities));
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

  const handleAddAmenityRow = () => {
    setEditAdditionalAmenities(prev => [...prev, { amenityName: "", description: "" }]);
  };

  const handleAmenityChange = (index, e) => {
    const { name, value } = e.target;
    setEditAdditionalAmenities(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [name]: value } : item
      )
    );
  };

  const handleRemoveAmenityRow = (index) => {
    setEditAdditionalAmenities(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate estimated budget from breakup
  const calculatedEstimatedBudget = editBudgetBreakup.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  // Handlers for ARSW/Associate Dean/Dean budget editing
  const canEditBudget = () => {
    if (!["ARSW", "associate-dean", "associate-dean-socio-cultural", "dean"].includes(role)) {
      return false;
    }

    if (!eventDetails) {
      return false;
    }
    // Check if it's this role's turn in the approval hierarchy
    if (canCurrentUserApprove(eventDetails.approvals)) {
      return true;
    }

    // Check if all previous approvals are approved
    return false;
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

    // Check if there's a query revision - if so, use that as the base for editing
    const queryRevision = getQueryOnBudgetRevision();
    let budgetToEdit;
    
    if (queryRevision && queryRevision.proposedBudgetBreakup) {
      // Use the proposed budget from the query revision
      budgetToEdit = queryRevision.proposedBudgetBreakup;
    } else {
      // Otherwise use the current budgetBreakup
      budgetToEdit = eventDetails.budgetBreakup;
    }

    const normalized = normalizeBudget(budgetToEdit);
    setProposedBudgetBreakup(normalized.length ? normalized : []);
    setBudgetJustification("");
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

      // Check if this is a finalization (ARSW editing after query)
      const isFinalization = !!getQueryOnBudgetRevision();

      await axios.patch(`${apiUrl}/event/edit-budget`, {
        eventId: eventDetails._id,
        role: role,
        proposedBudgetBreakup: transformedProposedBudget,
        proposedEstimatedBudget: calculatedProposedBudget,
        isFinalization: isFinalization,
        justification: budgetJustification.trim() || "",
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

  const handleRevertBudget = async () => {
    // Confirm before reverting
    if (!window.confirm("Are you sure you want to revert to the original budget? This action cannot be undone.")) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";

      await axios.post(`${apiUrl}/event/revert-budget`, {
        eventId: eventDetails._id,
        role: role,
      });

      toast.success("Budget reverted to original successfully!");
      
      // Refresh event details
      const response = await axios.get(`${apiUrl}/event/${eventDetails._id}`);
      setEventDetails(response.data);
    } catch (error) {
      console.error("Budget revert error:", error);
      toast.error("Failed to revert budget.");
    }
  };

  const handleEditFormSubmit = async (requestData) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";

      await axios.patch(`${apiUrl}/event/edit`, {
        eventId: eventDetails._id,
        userID: localStorage.getItem("userID"),
        updates: requestData,
      });
      
      toast.success("Event updated successfully!");
      setShowEditModal(false);
      
      // Refresh event details
      const response = await axios.get(`${apiUrl}/event/${eventDetails._id}`);
      setEventDetails(response.data);
      
      // Refresh edit history
      const historyResponse = await axios.get(`${apiUrl}/event/${eventDetails._id}/edit-history`);
      setEditHistory(historyResponse.data.editHistory || []);
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Failed to update event.");
      throw error;
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
        userID: userID,
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
      
      // Refresh queries and event details
      const queryResponse = await axios.get(`${apiUrl}/event/${id}/queries`);
      setQueries(queryResponse.data.queries || []);
      
      const eventResponse = await axios.get(`${apiUrl}/event/${id}`);
      setEventDetails(eventResponse.data);
      
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
    if (!['associate-dean', 'associate-dean-socio-cultural', 'dean', 'ARSW', 'students-welfare-office'].includes(role)) return false;
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
    if (!['associate-dean', 'associate-dean-socio-cultural', 'dean', 'ARSW', 'students-welfare-office'].includes(role)) return false;
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
        return role === 'dean' ? "Approve" : "Recommend";
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
      {/* Top Header */}
      <div className="ed-top-header">
        <div className="ed-top-left">
          <div className="ed-title-row">
            <button
              className="ed-back-btn"
              onClick={() => navigate(-1)}
              title="Go back"
            >
              ← Back
            </button>
            <h1 className="ed-event-name">
              {eventDetails.eventName}
              {eventDetails.status === 'Closed' && (
                <span className="badge bg-dark ms-2" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>Closed</span>
              )}
            </h1>
          </div>
        </div>
        <div className="ed-top-right">
          <div className="ed-ref-number-box">
            <span className="ed-ref-label">Reference Number</span>
            <span className="ed-ref-value">{eventDetails.referenceNumber || 'TBD'}</span>
          </div>
          <div className="ed-date-display">
            <span className="ed-date-label">Start Date</span>
            <span className="ed-date-value">{new Date(eventDetails.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {eventDetails.status === 'Closed' && (
        <div className="alert alert-dark mt-2">
          <strong>⛔ Event Closed</strong><br/>
          This event has been officially closed by {eventDetails.closedBy || 'an administrator'} on {eventDetails.closedAt ? new Date(eventDetails.closedAt).toLocaleDateString() : 'N/A'}.
        </div>
      )}

      {canEditEvent() && (
        <div className="ed-edit-bar">
          <button className="btn btn-warning btn-sm" onClick={() => setShowEditModal(true)}>✏️ Edit Event</button>
        </div>
      )}

      {/* Edit Modal - Using EventForm Component */}
      {showEditModal && eventDetails && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, overflowY: 'auto', paddingTop: '20px' }}>
          <div className="modal-content" style={{ backgroundColor: 'white', borderRadius: '8px', minWidth: '500px', maxWidth: '800px', marginBottom: '40px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Edit Event Details</h4>
              <button 
                type="button" 
                className="btn btn-close" 
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              ></button>
            </div>
            <div style={{ padding: '20px' }}>
              <EventForm 
                initialData={eventDetails}
                isEditMode={true}
                onSubmit={handleEditFormSubmit}
                onClose={() => setShowEditModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="ed-grid">

        {/* Left Column */}
        <div className="ed-left-col">

          {/* Event Information */}
          <div className="ed-card">
            <h5 className="ed-card-title">Event Information</h5>
            <div className="ed-info-row"><span className="ed-info-label">Club Name</span><span className="ed-info-value">{eventDetails.clubName}</span></div>
            <div className="ed-info-row"><span className="ed-info-label">Type</span><span className="ed-info-value">{eventDetails.eventType || '—'}</span></div>
            <div className="ed-info-row">
  <span className="ed-info-label">Start Date & Time</span>
  <span className="ed-info-value">
    {new Date(eventDetails.startDate).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '')}
  </span>
</div>

<div className="ed-info-row">
  <span className="ed-info-label">End Date & Time</span>
  <span className="ed-info-value">
    {new Date(eventDetails.endDate).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '')}
  </span>
</div>
            <div className="ed-info-row"><span className="ed-info-label">Venue</span><span className="ed-info-value">{eventDetails.eventVenue}</span></div>
            <div className="ed-info-row"><span className="ed-info-label">Source of Budget</span><span className="ed-info-value">{eventDetails.sourceOfBudget}</span></div>
            <div className="ed-info-row"><span className="ed-info-label">Estimated Budget</span><span className="ed-info-value">₹{eventDetails.estimatedBudget}</span></div>
            {eventDetails.budgetAnnexureNumber && (
              <div className="ed-info-row"><span className="ed-info-label">Budget Annexure No.</span><span className="ed-info-value">{eventDetails.budgetAnnexureNumber}</span></div>
            )}
          </div>

          {/* Budget Breakup */}
          {Array.isArray(eventDetails.budgetBreakup) && eventDetails.budgetBreakup.length > 0 && (
            <div className="ed-card">
              <h5 className="ed-card-title">Budget Breakup</h5>
              <table className="table table-sm">
                <thead>
                  <tr><th>Head</th><th style={{ width: '150px' }}>Amount (₹)</th></tr>
                </thead>
                <tbody>
                  {eventDetails.budgetBreakup.map((item, idx) => {
                    const label = item?.expenseHead ?? item?.label ?? item?.name ?? item?.head ?? item ?? "";
                    const amount = item?.estimatedAmount ?? item?.amount ?? item?.value ?? "";
                    return (
                      <tr key={idx}>
                        <td style={{ wordBreak: 'break-word' }}>{label || '—'}</td>
                        <td>{amount !== '' && amount !== null && amount !== undefined ? `₹${amount}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td>Total Budget</td>
                    <td>₹{eventDetails.estimatedBudget?.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              {canEditBudget() && (role !== "ARSW" || !isBudgetFinalized()) && (
                <button className="btn btn-warning btn-sm mt-2" onClick={handleOpenBudgetEditModal}>✏️ Edit Budget</button>
              )}
            </div>
          )}

          {/* Budget Modification History */}
          {eventDetails.budgetHistory && eventDetails.budgetHistory.length >= 2 && (
            <div className="ed-card">
                <h5 className="ed-card-title mb-0">
                  Budget Modification History
                  <span className="badge bg-secondary ms-2" style={{ fontSize: "0.75rem" }}>
                    {eventDetails.budgetHistory.length}
                  </span>
                </h5>

              {showBudgetHistory && (
                <div className="mt-3">
                  {(() => {
                    const history = [...eventDetails.budgetHistory].reverse();
                    const visibleHistory = showAllBudgetHistory ? history : history.slice(0, 1);
                    
                    return (
                      <>
                        {visibleHistory.map((entry, idx) => {
                          const entryNum = eventDetails.budgetHistory.length - idx;
                          const roleLabel = entry.editedBy
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, c => c.toUpperCase());
                          let revision = null;
                          if (entry.editedBy === "ARSW") {
                            const arswIdx = eventDetails.budgetHistory
                              .slice(0, eventDetails.budgetHistory.length - idx)
                              .filter(e => e.editedBy === "ARSW").length - 1;
                            revision = eventDetails.arsw_budget_revisions?.[arswIdx] || null;
                          }
                          return (
                            <BudgetHistoryEntry
                              key={idx}
                              entry={entry}
                              entryNum={entryNum}
                              roleLabel={roleLabel}
                              isLatest={idx === 0}
                              revision={revision}
                            />
                          );
                        })}
                        {eventDetails.budgetHistory.length > 1 && (
                          <div className="text-center mt-2">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setShowAllBudgetHistory(!showAllBudgetHistory)}
                            >
                              {showAllBudgetHistory ? "Hide Old Changes" : "Show All Changes"}
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Requirements */}
          <div className="ed-card">
            <h5 className="ed-card-title">Requirements</h5>
            {Array.isArray(eventDetails.requirements) && eventDetails.requirements.length > 0 ? (
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Sl. No</th>
                    <th>Requirement</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {eventDetails.requirements.map((req, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{typeof req === 'string' ? req : req.name || ''}</td>
                      <td>{typeof req === 'string' ? '—' : req.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted mb-0">No requirements specified</p>
            )}
            {eventDetails.anyAdditionalAmenities && (
              <div className="ed-info-row mt-2">
                <span className="ed-info-label">Additional Amenities</span>
                <span className="ed-info-value">{eventDetails.anyAdditionalAmenities}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="ed-card">
            <h5 className="ed-card-title">Description</h5>
            <div
              className="ed-description-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(eventDetails.eventDescription || '') }}
            />
          </div>

          {/* Edit History Section - All Changes in One Table */}
          {(() => {
            const formatValue = (value) => {
              if (value === null || value === undefined) return 'N/A';
              if (Array.isArray(value)) return value.join(', ');
              if (typeof value === 'object' && !(value instanceof Date)) return JSON.stringify(value);
              if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              }
              return String(value);
            };

            const getVisibleChanges = (changes) =>
              Object.entries(changes || {}).filter(([field, change]) =>
                field !== 'budgetBreakup' &&
                formatValue(change.oldValue) !== formatValue(change.newValue)
              );

            const validEdits = editHistory.filter(edit =>
              edit.changes && getVisibleChanges(edit.changes).length > 0
            );

            if (validEdits.length === 0) return null;
            
            // Collect all changes across all edits
            const allChanges = [];
            validEdits.forEach((edit, index) => {
              getVisibleChanges(edit.changes).forEach(([field, change]) => {
                allChanges.push({
                  editNum: validEdits.length - index,
                  editorName: edit.editorName,
                  editorEmail: edit.editorEmail,
                  editedAt: new Date(edit.editedAt),
                  field,
                  oldValue: change.oldValue,
                  newValue: change.newValue
                });
              });
            });

            return (
              <div className="ed-card ed-card-history">
                <div className="ed-collapsible-header">
                  <h5 className="ed-card-title mb-0">Edit History <span className="badge bg-secondary ms-2" style={{ fontSize: "0.75rem" }}>{validEdits.length}</span></h5>
                  <button
                    className="ed-toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditHistory(!showEditHistory);
                    }}
                  >
                    {showEditHistory ? "Hide" : "Show"}
                  </button>
                </div>
                {showEditHistory && (
                  <div className="edit-history-table-wrapper">
                    <table className="table table-sm table-bordered mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '12%' }}>Edit #</th>
                          <th style={{ width: '25%' }}>Field</th>
                          <th style={{ width: '25%' }}>Old Value</th>
                          <th style={{ width: '25%' }}>New Value</th>
                          <th style={{ width: '13%' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allChanges.map((change, idx) => {
                          const displayField = change.field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          return (
                            <tr key={idx}>
                              <td><strong>#{change.editNum}</strong></td>
                              <td><strong>{displayField}</strong></td>
                              <td style={{ color: '#dc3545', wordBreak: 'break-word', backgroundColor: '#fff5f5' }}><small>{formatValue(change.oldValue)}</small></td>
                              <td style={{ color: '#28a745', wordBreak: 'break-word', backgroundColor: '#f0fff4' }}><small>{formatValue(change.newValue)}</small></td>
                              <td><small>{change.editedAt.toLocaleDateString()}</small></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
        <div className="ed-right-col">
          <div className="ed-card">
            <h5 className="ed-card-title">Participants</h5>
            <div className="ed-participant-stats">
              <div className="ed-stat-box">
                <span className="ed-stat-number">{eventDetails.internalParticipants || 0}</span>
                <span className="ed-stat-label">Internal</span>
              </div>
              <div className="ed-stat-box">
                <span className="ed-stat-number">{eventDetails.externalParticipants || 0}</span>
                <span className="ed-stat-label">External</span>
              </div>
            </div>
            {eventDetails.externalParticipants > 0 && eventDetails.listOfCollaboratingOrganizations && (
              <div className="ed-info-row mt-3">
                <span className="ed-info-label">Collaborating Orgs</span>
                <span className="ed-info-value">{eventDetails.listOfCollaboratingOrganizations}</span>
              </div>
            )}
          </div>

          {/* Organizer Details */}
          <div className="ed-card">
            <h5 className="ed-card-title">Organizer Details</h5>
            <div className="organizer-detail-row"><span className="organizer-label">Name</span><span className="organizer-value">{eventDetails.nameOfTheOrganizer || '—'}</span></div>
            <div className="organizer-detail-row"><span className="organizer-label">Designation</span><span className="organizer-value">{eventDetails.designation || '—'}</span></div>
            <div className="organizer-detail-row"><span className="organizer-label">Email</span><span className="organizer-value">{eventDetails.email || '—'}</span></div>
            <div className="organizer-detail-row"><span className="organizer-label">Phone</span><span className="organizer-value">{eventDetails.phoneNumber || '—'}</span></div>
          </div>

          {/* Unified Approval & Activity Timeline */}
          <div className="ed-card">
            <h5 className="ed-card-title">Approval & Activity</h5>
            <div className="activity-timeline">
              {(() => {
                const completed = buildTimelineEvents();
                
                // Check if there's any rejection in the approval chain
                const hasRejection = (eventDetails.approvals || []).some(a => a.status === 'Rejected');
                
                // Always show pending items (even for display purposes after rejection)
                const pending = (eventDetails.approvals || []).filter(a =>
                  a.status !== 'Approved' && a.status !== 'Rejected'
                );
                
                // Find the first pending index to mark it as "current"
                const firstPendingRole = pending.length > 0 ? pending[0].role : null;

                return (
                  <>
                    {completed.length === 0 && pending.length === 0 && (
                      <p className="text-muted small">No activity recorded yet.</p>
                    )}

                    {completed.map((event, index) => (
                      <div key={`c-${index}`} className="at-item">
                        <div className="at-line-col">
                          <div className="at-dot" style={{ background: event.color, borderColor: event.color }}>{event.icon}</div>
                          {(index < completed.length - 1 || pending.length > 0) && <div className="at-connector" />}
                        </div>
                        <div className="at-content" style={{ borderLeftColor: event.color }}>
                          <div className="at-title">{event.title}</div>
                          {event.description && event.description !== 'No comments' && (
                            <div className="at-desc">{event.description}</div>
                          )}
                          <div className="at-date">
                            {event.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' '}
                            {event.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}

                    {pending.map((approval, index) => {
                      const isCurrent = !hasRejection && approval.role === firstPendingRole;
                      const dotColor = isCurrent ? '#007bff' : hasRejection ? '#dc3545' : '#adb5bd';
                      const borderColor = isCurrent ? '#007bff' : hasRejection ? '#dc3545' : '#dee2e6';
                      const isLast = index === pending.length - 1;
                      const dotIcon = isCurrent ? '⏳' : hasRejection ? '—' : '○';
                      const statusText = hasRejection ? 'Not required' : (approval.role === 'dean' ? 'Pending approval' : 'Pending recommendation');
                      const statusBadge = isCurrent ? 'Awaiting' : hasRejection ? 'Rejected Below' : null;
                      
                      return (
                        <div key={`p-${index}`} className={`at-item at-item-pending${hasRejection ? ' at-item-rejected' : ''}`}>
                          <div className="at-line-col">
                            <div
                              className={`at-dot at-dot-pending${isCurrent ? ' at-dot-current' : ''}`}
                              style={{ background: dotColor, borderColor: dotColor }}
                            >
                              {dotIcon}
                            </div>
                            {!isLast && <div className="at-connector at-connector-pending" />}
                          </div>
                          <div className="at-content at-content-pending" style={{ borderLeftColor: borderColor }}>
                            <div className="at-title" style={{ color: isCurrent ? '#212529' : hasRejection ? '#6c757d' : '#adb5bd' }}>
                              {approval.role.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              {statusBadge && <span className={`badge ms-2 ${isCurrent ? 'bg-primary' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>{statusBadge}</span>}
                            </div>
                            <div className="at-date" style={{ color: isCurrent ? '#495057' : hasRejection ? '#adb5bd' : '#adb5bd' }}>{statusText}</div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Queries Section - In Right Column Below Timeline - HIDDEN */}
          {false && queries.length > 0 && (
            <div className="ed-card ed-card-query mt-3">
              <div>
                <h5 className="ed-card-title mb-3">Queries <span className="badge bg-secondary ms-2" style={{ fontSize: "0.75rem" }}>{queries.length}</span></h5>
              </div>
              <div className="queries-section">
                {/* Queries hidden */}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Action Buttons */}
      <div className="ed-actions">
        {/* Approval buttons for ARSW and other roles */}
        {(canCurrentUserApprove(eventDetails.approvals) || canTakeActionWhenEdited(eventDetails.approvals)) && (
          <>
            {role === "ARSW" && getPendingBudgetRevision() ? (
              <div className="alert alert-warning mb-3">
                <strong>⏳ Awaiting Club Secretary Review:</strong> Your budget revision is pending club secretary approval. 
                <br/>
                <small>You cannot proceed until they accept or raise a query.</small>
              </div>
            ) : null}

            <button 
              className="btn btn-success" 
              onClick={() => handleApprovalClick('Approved')}
              disabled={
                (role === "ARSW" && getPendingBudgetRevision()) ||
                (role === "ARSW" && getQueryOnBudgetRevision())
              }
            >
              {role === 'dean' ? 'Approve' : 'Recommend'}
            </button>
            <button className="btn btn-danger" onClick={() => handleApprovalClick('Rejected')}>Reject</button>
            <button className="btn btn-warning" onClick={() => handleApprovalClick('Query')}>Raise Query</button>
          </>
        )}
        {canCloseEvent() && (
          <button className="btn btn-dark" onClick={() => setShowCloseModal(true)}>Close Event</button>
        )}
        {canRaiseApprovedQuery() && (
          <button className="btn btn-info" onClick={() => setShowApprovedQueryModal(true)}>Raise Query</button>
        )}
        <button className="btn btn-primary" onClick={handleGeneratePDF}>Generate & Preview PDF</button>
      </div>

      {/* PDF Preview */}
      {isPDFGenerated && (
        <div className="ed-card mt-3">
          <iframe
            id="pdf-preview"
            key={pdfPreviewUrl || pdfPreviewDataUrl}
            className="pdf-preview"
            style={{ width: '100%', height: '500px', border: 'none' }}
            src={pdfPreviewUrl || pdfPreviewDataUrl || undefined}
            title="PDF Preview"
          />
          {!pdfPreviewUrl && pdfPreviewDataUrl && (
            <p style={{ marginTop: '8px' }}>
              If the preview stays blank, <a href={pdfPreviewDataUrl} target="_blank" rel="noopener noreferrer">open the PDF in a new tab</a>.
            </p>
          )}
        </div>
      )}

      {/* Edit Modal - Using EventForm Component */}
      {showEditModal && eventDetails && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, overflowY: 'auto', paddingTop: '20px' }}>
          <div className="modal-content" style={{ backgroundColor: 'white', borderRadius: '8px', minWidth: '500px', maxWidth: '800px', marginBottom: '40px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Edit Event Details</h4>
              <button 
                type="button" 
                className="btn btn-close" 
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              ></button>
            </div>
            <div style={{ padding: '20px' }}>
              <EventForm 
                initialData={eventDetails}
                isEditMode={true}
                onSubmit={handleEditFormSubmit}
                onClose={() => setShowEditModal(false)}
              />
            </div>
          </div>
        </div>
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
              <h4>
                {getQueryOnBudgetRevision() ? "Edit Budget (Final)" : "Edit Budget Proposal"}
              </h4>

              {/* Show info about what budget is being edited */}
              {getQueryOnBudgetRevision() && (
                <div className="alert alert-info mb-3">
                  <strong>📋 Reviewing Query Feedback:</strong>
                  <p className="mt-2 mb-0">{getQueryOnBudgetRevision().clubSecretaryResponse}</p>
                </div>
              )}

              {/* Original/Current Budget Summary */}
              <div className="alert alert-secondary mb-3">
                <h6>
                  {getQueryOnBudgetRevision() ? 
                    `Previous Proposed Budget: ₹${getQueryOnBudgetRevision().proposedEstimatedBudget}` 
                    : `Current Budget: ₹${eventDetails.estimatedBudget}`
                  }
                </h6>
              </div>

              {/* Proposed Budget Breakup Section */}
              <div className="form-group mb-3">
                <label><strong>
                  {getQueryOnBudgetRevision() ? 
                    "Revised Budget Breakup (Final)" 
                    : "Proposed Budget Breakup"
                  }
                </strong></label>
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

              {/* Justification field */}
              <div className="form-group mb-3">
                <label>
                  <strong>Reason / Justification </strong>
                  <span className="text-muted" style={{ fontWeight: 400, fontSize: "0.85rem" }}></span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Briefly explain why this budget modification is needed..."
                  value={budgetJustification}
                  onChange={e => setBudgetJustification(e.target.value)}
                />
              </div>

              <div className="modal-buttons mt-3">
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setShowBudgetEditModal(false);
                    setProposedBudgetBreakup([]);
                    setBudgetJustification("");
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

        {/* Budget Revision Review Modal for Club Secretary */}
        {showBudgetRevisionModal && selectedRevision && (
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
                minWidth: "500px",
                maxWidth: "700px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h4>Review Budget Revision</h4>
              <p className="text-muted">
                ARSW has submitted a revised budget for your event. Please review and respond.
              </p>

              {/* Revised Budget Details */}
              <div className="alert alert-info mb-3">
                <strong>ARSW Revision #{selectedRevision.revisionNumber}</strong>
                <div className="mt-2">
                  <p className="mb-1">
                    <strong>Proposed Budget: </strong>
                    <span className="text-danger">₹{selectedRevision.proposedEstimatedBudget}</span>
                  </p>
                  <p className="mb-1">
                    <strong>Original Budget: </strong>
                    ₹{eventDetails.estimatedBudget}
                  </p>
                  <p className="mb-0">
                    <strong>Submitted: </strong>
                    {new Date(selectedRevision.editedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {(() => {
                const arswHistoryEntries = (eventDetails.budgetHistory || []).filter(e => e.editedBy === "ARSW");
                const matchingEntry = arswHistoryEntries[selectedRevision.revisionNumber - 1];
                return matchingEntry?.justification ? (
                  <div className="alert alert-warning py-2 px-3 mb-3" style={{ fontSize: '0.875rem' }}>
                    <strong>ARSW's Reason:</strong> {matchingEntry.justification}
                  </div>
                ) : null;
              })()}

              {/* Budget Breakup */}
              <div className="mb-3">
                <h6>Budget Breakup:</h6>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Expense Head</th>
                        <th style={{ width: "150px" }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRevision.proposedBudgetBreakup.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.expenseHead}</td>
                          <td>₹{item.estimatedAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response Options */}
              <div className="form-group mb-3">
                <label><strong>Your Response:</strong></label>
                <div className="mb-2">
                  <label className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      name="revisionResponse"
                      value="Approved"
                      checked={revisionResponseType === "Approved"}
                      onChange={(e) => {
                        setRevisionResponseType(e.target.value);
                        setRevisionResponse("");
                      }}
                    />
                    <span className="form-check-label">✓ Accept the revised budget</span>
                  </label>
                </div>
                <div>
                  <label className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      name="revisionResponse"
                      value="QueryRaised"
                      checked={revisionResponseType === "QueryRaised"}
                      onChange={(e) => {
                        setRevisionResponseType(e.target.value);
                        setRevisionResponse("");
                      }}
                    />
                    <span className="form-check-label">? Raise a query/suggestion</span>
                  </label>
                </div>
              </div>

              {/* Query text – only required when raising a query */}
              {revisionResponseType === "QueryRaised" && (
                <div className="form-group mb-3">
                  <label>
                    <strong>Your Query / Feedback<span className="text-danger"> *</span></strong>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Provide your feedback or query about the proposed budget..."
                    value={revisionResponse}
                    onChange={(e) => setRevisionResponse(e.target.value)}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="modal-buttons mt-3">
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setShowBudgetRevisionModal(false);
                    setSelectedRevision(null);
                    setRevisionResponse("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleRespondToBudgetRevision}
                  disabled={revisionResponseType === "QueryRaised" && !revisionResponse.trim()}
                >
                  <i className="bi bi-check-circle"></i> Submit Response
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Display pending budget revision notification for club secretary */}
        {role === "club-secretary" && eventDetails && getPendingBudgetRevision() && (
          <div className="alert alert-warning alert-dismissible fade show mt-3" role="alert">
            <strong>⚠️ Action Required: Budget Revision Awaiting Your Review</strong>
            <p className="mb-2">
              ARSW has submitted a revised budget for your event. Please review and accept or raise a query.
            </p>
            <button
              className="btn btn-sm btn-warning"
              onClick={() => handleOpenBudgetRevisionReview(getPendingBudgetRevision())}
            >
              Review Budget Revision
            </button>
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}

        {/* Display query on budget revision notification for club secretary */}
        {role === "club-secretary" && eventDetails && getQueryOnBudgetRevision() && (
          <div className="alert alert-info alert-dismissible fade show mt-3" role="alert">
            <strong>⏳ Waiting for ARSW Response</strong>
            <p className="mb-1 mt-1">
              You raised the following query on the budget revision. Waiting for ARSW to address it.
            </p>
            <div className="p-2 bg-white rounded border" style={{ fontSize: "0.875rem" }}>
              {getQueryOnBudgetRevision().clubSecretaryResponse || "—"}
            </div>
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}
    </div>
  );
};

export default EventDetails;
