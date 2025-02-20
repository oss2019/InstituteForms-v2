import express from "express";
import {
  applyForEventApproval,
  getUserEvents,
  approveApplication,
  getApprovedApplications,
  getPendingApprovals,
  getRejectedApplications,
  getEventById,
  handleApprovalStatus, // Import the updated controller
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

// Approve or reject an event application based on the status (PATCH)
router.patch("/:applicationId/status", handleApprovalStatus);

// Get event details by ID (GET)
router.get("/:id", getEventById);

export default router;