import express from "express";
import {
  submitComplaint,
  getMyComplaints,
  getActionNeededComplaints,
  getAllComplaintsForRole,
  handleComplaintAction,
  replyToWelfareQuery,
  getComplaintById,
  getComplaintsForSWO,
} from "../controller/welfare.controller.js";

const router = express.Router();

// ── Student ──────────────────────────────────────────────────────────────────
router.post("/submit",       submitComplaint);        // submit a new complaint
router.post("/my",           getMyComplaints);        // view own complaints
router.post("/query/reply",  replyToWelfareQuery);    // reply to a query from staff

// ── Secretary / FIC / Associate Dean ─────────────────────────────────────────
router.post("/action-needed",      getActionNeededComplaints); // "Action Needed" tab
router.post("/all-for-role",       getAllComplaintsForRole);   // "All / Initiated" tab
router.post("/action/:id",         handleComplaintAction);     // resolve / escalate / query

// ── SW Office (read-only) ────────────────────────────────────────────────────
router.get("/swo",  getComplaintsForSWO);

// ── Detail view (all authenticated roles) ────────────────────────────────────
// NOTE: this catch-all /:id MUST come last to avoid swallowing named paths
router.get("/:id",  getComplaintById);

export default router;
