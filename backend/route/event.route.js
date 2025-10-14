import express from "express";
import {
  applyForEventApproval,
  getUserEvents,
  approveApplication,
  getApprovedApplications,
  editEventDetails,
  getPendingApprovals,
  getRejectedApplications,
  getClosedApplications,
  getEventById,
  handleApprovalStatus, // Import the updated controller
  raiseQuery,
  getEventQueries,
  replyToQuery,
  getSemesterOptions,
  getApprovedApplicationsWithFilters,
  closeEvent,
  raiseQueryForApprovedEvent,
  getPendingApprovalsWithFilters,
  getEditHistory,
} from "../controller/event.controller.js";

const router = express.Router();

// Apply for event approval (POST)
router.post("/apply", applyForEventApproval);

// Get all events for a user (POST)
router.post("/user-events", getUserEvents);

// Get all pending event applications (POST)
router.post("/pending", getPendingApprovals);

// Get all approved event applications (POST)
router.post("/approved", getApprovedApplications);

// Get all rejected event applications (POST)
router.post("/rejected", getRejectedApplications);

// Get all closed event applications (POST)
router.post("/closed", getClosedApplications);

// Approve or reject an event application based on the status (PATCH)
router.patch("/:applicationId/status", handleApprovalStatus);

// Get event details by ID (GET)
router.get("/:id", getEventById);

// Raise a query for an event application (POST)
router.post("/raise-query", raiseQuery);

// Raise a query for an approved event (POST) - for associate-dean, dean, ARSW
router.post("/raise-query-approved", raiseQueryForApprovedEvent);

// Get all queries for an event (GET)
router.get("/:eventId/queries", getEventQueries);

// Reply to a query (POST)
router.post("/reply-query", replyToQuery);

//Close an event (PATCH)
router.patch("/close", closeEvent);

// Edit all event details (PATCH)
router.patch("/edit", editEventDetails);

// Get edit history for an event (GET)
router.get("/:eventId/edit-history", getEditHistory);

// Get semester options for filtering (GET)
router.get("/semesters/options", getSemesterOptions);

// Get approved applications with filters and search (POST)
router.post("/approved/filtered", getApprovedApplicationsWithFilters);

// Get pending applications with filters and search (POST)
router.post("/pending/filtered", getPendingApprovalsWithFilters);

export default router;