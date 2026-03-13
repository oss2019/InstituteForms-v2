import { WelfareComplaint } from "../models/welfare.model.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ─── Email transporter (same pattern as event.controller.js) ─────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  if (!to || to.includes("PLACEHOLDER")) {
    console.warn(`Welfare: skipping email to placeholder address: ${to}`);
    return;
  }
  const mailOptions = { from: process.env.EMAIL_USER, to, subject, text };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Welfare email error:", error);
    else console.log("Welfare email sent:", info.response);
  });
};

// ─── Role → email map ─────────────────────────────────────────────────────────
// ⚠ TESTING MODE: all roles point to the test address mc24bt017@iitdh.ac.in
// TODO: Before going live, restore each role to its actual confirmed email:
//   mess-secretary   → gs.mess@iitdh.ac.in
//   canteen-secretary → gs.mess@iitdh.ac.in
//   fic-mess-canteen → fic.mess@iitdh.ac.in
//   gen-sec-hostel   → gsha@iitdh.ac.in, pgha@iitdh.ac.in
//   hostel-manager   → hostelmanager-pc@iitdh.ac.in
//   warden           → PLACEHOLDER@iitdh.ac.in
//   adean-hostel     → adean.sw.hostel@iitdh.ac.in
//   associate-dean   → PLACEHOLDER@iitdh.ac.in  (awaiting confirmation)
//   sw-office        → studentswelfare.office@iitdh.ac.in
const TEST_EMAIL = "mc24bt017@iitdh.ac.in";
const welfareRoleEmails = [
  { role: "mess-secretary",   email: TEST_EMAIL },
  { role: "canteen-secretary", email: TEST_EMAIL },
  { role: "fic-mess-canteen", email: TEST_EMAIL },
  { role: "gen-sec-hostel",   email: TEST_EMAIL },
  { role: "hostel-manager",   email: TEST_EMAIL },
  { role: "warden",           email: TEST_EMAIL },
  { role: "adean-hostel",     email: TEST_EMAIL },
  { role: "associate-dean",   email: TEST_EMAIL },
  { role: "sw-office",        email: TEST_EMAIL },
];

const getWelfareEmail = (role) => {
  const match = welfareRoleEmails.find((e) => e.role === role);
  return match ? match.email : null;
};

// ─── Hierarchy definitions ────────────────────────────────────────────────────
const HIERARCHIES = {
  mess:          ["mess-secretary",    "fic-mess-canteen",  "associate-dean"],
  canteen:       ["canteen-secretary", "fic-mess-canteen",  "associate-dean"],
  hostel:        ["gen-sec-hostel", "hostel-manager", "warden", "adean-hostel"],
  // legacy alias support for older docs
  accommodation: ["gen-sec-hostel", "hostel-manager", "warden", "adean-hostel"],
};

const getHierarchy = (complaintType) => HIERARCHIES[complaintType] || [];
const normalizeComplaintType = (type) => (type === "accommodation" ? "hostel" : type);

// ─── Complaint ID generator ───────────────────────────────────────────────────
// Format: IITDH/MESS/2026/001 — resets counter each calendar year per type
const generateComplaintId = async (complaintType) => {
  const segment = complaintType.toUpperCase(); // MESS | CANTEEN | ACCOMMODATION
  const year    = new Date().getFullYear();
  const prefix  = `IITDH/${segment}/${year}/`;
  const count   = await WelfareComplaint.countDocuments({
    complaintId: { $regex: `^${prefix}` },
  });
  const padded = String(count + 1).padStart(3, "0");
  return `${prefix}${padded}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUBMIT COMPLAINT (called by student from portal forms)
// ─────────────────────────────────────────────────────────────────────────────
export const submitComplaint = async (req, res) => {
  try {
    const { complaintType, userId, ...rest } = req.body;
    const normalizedType = normalizeComplaintType(complaintType);

    if (!normalizedType || !HIERARCHIES[normalizedType]) {
      return res.status(400).json({ message: "Invalid complaint type. Must be 'mess', 'canteen', or 'hostel'." });
    }
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }
    if (!rest.title || !rest.description) {
      return res.status(400).json({ message: "title and description are required." });
    }

    const hierarchy = getHierarchy(normalizedType);
    const firstRole = hierarchy[0];
    const now       = new Date();

    // Build approvals array — first role gets arrivedAt set immediately, rest are null
    const approvals = hierarchy.map((role, idx) => ({
      role,
      status:    "Pending",
      remark:    "",
      arrivedAt: idx === 0 ? now : null,
      actionAt:  null,
    }));

    const complaintId = await generateComplaintId(complaintType);

    const complaint = new WelfareComplaint({
      complaintId,
      complaintType: normalizedType,
      userId,
      ...rest,
      approvals,
      status: "Pending",
    });

    await complaint.save();

    // Notify secretary
    const secEmail = getWelfareEmail(firstRole);
    await sendEmail(
      secEmail,
      `New ${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)} Complaint: ${complaint.title} [${complaintId}]`,
      `A new complaint has been submitted and requires your attention.\n\nComplaint ID : ${complaintId}\nStudent      : ${complaint.studentName} (${complaint.studentEmail})\nTitle        : ${complaint.title}\nSeverity     : ${complaint.severity.toUpperCase()}\n\nPlease log in to the portal to review and take action.\n\nBest regards,\nIIT Dharwad Student Welfare System`
    );

    // Confirm to student
    await sendEmail(
      complaint.studentEmail,
      `Complaint Submitted Successfully [${complaintId}]`,
      `Dear ${complaint.studentName},\n\nYour complaint has been submitted and assigned a tracking ID.\n\nComplaint ID : ${complaintId}\nTitle        : ${complaint.title}\nType         : ${normalizedType}\nSeverity     : ${complaint.severity.toUpperCase()}\n\nYour complaint has been forwarded to the ${firstRole.replace(/-/g, " ")}. You can track its status from the "My Complaints" section in your portal.\n\nBest regards,\nIIT Dharwad Student Welfare`
    );

    res.status(201).json({ message: "Complaint submitted successfully.", complaint });
  } catch (error) {
    console.error("submitComplaint error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error.", errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET MY COMPLAINTS (student — all complaints they submitted)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyComplaints = async (req, res) => {
  const { userId } = req.body;
  try {
    if (!userId) return res.status(400).json({ message: "userId is required." });

    const complaints = await WelfareComplaint.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ complaints });
  } catch (error) {
    console.error("getMyComplaints error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET ACTION-NEEDED COMPLAINTS (for any staff role)
//    3-filter logic — same pattern as getPendingApprovals in event.controller.js
//    Filter 1 (DB)  : complaints where this role is in approvals array
//    Filter 2 (JS)  : this role's status is "Pending" or "Queried"
//    Filter 3 (JS)  : ALL roles before this one are "Resolved" or "Escalated"
// ─────────────────────────────────────────────────────────────────────────────
export const getActionNeededComplaints = async (req, res) => {
  const { role } = req.body;
  try {
    if (!role) return res.status(400).json({ message: "Role is required." });

    // Filter 1
    let complaints = await WelfareComplaint.find({
      "approvals.role": role,
      status: "Pending",
    }).sort({ createdAt: -1 });

    // Filter 2
    complaints = complaints.filter((c) => {
      const entry = c.approvals.find((a) => a.role === role);
      return entry && (entry.status === "Pending" || entry.status === "Queried");
    });

    // Filter 3 — all prior roles must be Resolved or Escalated
    complaints = complaints.filter((c) => {
      const hierarchy = getHierarchy(c.complaintType);
      const myIndex   = hierarchy.indexOf(role);
      if (myIndex === -1) return false;
      return hierarchy.slice(0, myIndex).every((prevRole) => {
        const prevEntry = c.approvals.find((a) => a.role === prevRole);
        return prevEntry && (prevEntry.status === "Resolved" || prevEntry.status === "Escalated");
      });
    });

    res.status(200).json({ complaints });
  } catch (error) {
    console.error("getActionNeededComplaints error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET ALL COMPLAINTS FOR ROLE (FIC / Associate Dean — full read-only view)
//    Returns all complaints for the types this role handles, regardless of stage
//    Used for the "Initiated" / "View All" tab
// ─────────────────────────────────────────────────────────────────────────────
export const getAllComplaintsForRole = async (req, res) => {
  const { role } = req.body;
  try {
    if (!role) return res.status(400).json({ message: "Role is required." });

    // Find all complaint types this role appears in
    const relevantTypes = Object.entries(HIERARCHIES)
      .filter(([, h]) => h.includes(role))
      .map(([type]) => type);

    if (relevantTypes.length === 0) {
      return res.status(200).json({ complaints: [] });
    }

    const complaints = await WelfareComplaint.find({
      complaintType: { $in: relevantTypes },
    }).sort({ createdAt: -1 });

    res.status(200).json({ complaints });
  } catch (error) {
    console.error("getAllComplaintsForRole error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. HANDLE COMPLAINT ACTION (Resolve / Escalate / Query)
//    action: "resolve" | "escalate" | "query"
//    remark: mandatory description for resolve; question text for query; optional note for escalate
//    fineInvolved + fineNote: only valid for associate-dean + action="resolve"
// ─────────────────────────────────────────────────────────────────────────────
export const handleComplaintAction = async (req, res) => {
  const { id } = req.params;
  const { role, action, remark, fineInvolved, fineNote, purchaseMadeForRepair, purchaseNote } = req.body;

  try {
    if (!role || !action) {
      return res.status(400).json({ message: "role and action are required." });
    }
    if (!["resolve", "escalate", "query"].includes(action)) {
      return res.status(400).json({ message: "action must be 'resolve', 'escalate', or 'query'." });
    }

    const complaint = await WelfareComplaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });

    const hierarchy = getHierarchy(complaint.complaintType);
    const myIndex   = hierarchy.indexOf(role);
    if (myIndex === -1) {
      return res.status(403).json({ message: "This role is not part of the hierarchy for this complaint type." });
    }

    const approvalIndex = complaint.approvals.findIndex((a) => a.role === role);
    if (approvalIndex === -1) {
      return res.status(400).json({ message: "No approval entry found for this role." });
    }

    const entry = complaint.approvals[approvalIndex];
    if (!entry.arrivedAt) {
      return res.status(400).json({ message: "This complaint has not reached your role yet. Action is not allowed." });
    }
    if (entry.status !== "Pending" && entry.status !== "Queried") {
      return res.status(400).json({ message: "No pending action required from this role on this complaint." });
    }

    const now = new Date();

    // ── RESOLVE ───────────────────────────────────────────────────────────────
    if (action === "resolve") {
      if (!remark || !remark.trim()) {
        return res.status(400).json({ message: "A remark describing the resolution is mandatory." });
      }

      complaint.approvals[approvalIndex].status   = "Resolved";
      complaint.approvals[approvalIndex].remark   = remark.trim();
      complaint.approvals[approvalIndex].actionAt = now;

      complaint.status      = "Resolved";
      complaint.resolvedAt  = now;
      complaint.resolvedBy  = role;

      // Fine ticker — only associate-dean can mark fine involved
      if (role === "associate-dean" && fineInvolved === true) {
        complaint.fineInvolved = true;
        complaint.fineNote     = fineNote || "";
      }

      // Hostel purchase ticker — only adean-hostel can mark purchase made
      if (role === "adean-hostel" && purchaseMadeForRepair === true) {
        complaint.purchaseMadeForRepair = true;
        complaint.purchaseNote          = purchaseNote || "";
      }

      await complaint.save();

      await sendEmail(
        complaint.studentEmail,
        `Your Complaint Has Been Resolved [${complaint.complaintId}]`,
        `Dear ${complaint.studentName},\n\nYour complaint "${complaint.title}" (ID: ${complaint.complaintId}) has been resolved by the ${role.replace(/-/g, " ")}.\n\nResolution note:\n${remark}\n\nIf your issue persists, please submit a new complaint through the student portal.\n\nBest regards,\nIIT Dharwad Student Welfare`
      );

      return res.status(200).json({ message: "Complaint resolved successfully." });
    }

    // ── ESCALATE ("Send Above") ───────────────────────────────────────────────
    if (action === "escalate") {
      const nextRole = hierarchy[myIndex + 1];
      if (!nextRole) {
        return res.status(400).json({ message: "This role is the last in the hierarchy — cannot escalate further." });
      }

      complaint.approvals[approvalIndex].status   = "Escalated";
      complaint.approvals[approvalIndex].remark   = remark || "";
      complaint.approvals[approvalIndex].actionAt = now;

      // Mark arrivedAt for the next role
      const nextApprovalIndex = complaint.approvals.findIndex((a) => a.role === nextRole);
      if (nextApprovalIndex !== -1) {
        complaint.approvals[nextApprovalIndex].arrivedAt = now;
      }

      await complaint.save();

      const nextEmail = getWelfareEmail(nextRole);
      await sendEmail(
        nextEmail,
        `Complaint Escalated to You [${complaint.complaintId}]`,
        `A complaint has been escalated to you by the ${role.replace(/-/g, " ")}.\n\nComplaint ID : ${complaint.complaintId}\nType         : ${complaint.complaintType}\nStudent      : ${complaint.studentName} (${complaint.studentEmail})\nTitle        : ${complaint.title}\nSeverity     : ${complaint.severity.toUpperCase()}\n${remark ? `\nNote from ${role.replace(/-/g, " ")}: ${remark}` : ""}\n\nPlease log in to the portal to review and take action.\n\nBest regards,\nIIT Dharwad Student Welfare System`
      );

      return res.status(200).json({ message: "Complaint escalated successfully." });
    }

    // ── QUERY STUDENT ─────────────────────────────────────────────────────────
    if (action === "query") {
      const questionText = remark; // remark carries the question text for query action
      if (!questionText || !questionText.trim()) {
        return res.status(400).json({ message: "Question text is required for a query." });
      }

      // Pause this role's status at "Queried"
      complaint.approvals[approvalIndex].status = "Queried";
      // Do NOT set actionAt — complaint is paused until student replies

      complaint.queries.push({
        askerRole:    role,
        questionText: questionText.trim(),
        studentReply: "",
        status:       "Unanswered",
        raisedAt:     now,
      });

      await complaint.save();

      await sendEmail(
        complaint.studentEmail,
        `Query Raised on Your Complaint [${complaint.complaintId}]`,
        `Dear ${complaint.studentName},\n\nThe ${role.replace(/-/g, " ")} has raised a question regarding your complaint "${complaint.title}" (ID: ${complaint.complaintId}).\n\nQuery:\n${questionText}\n\nPlease log in to the Student Portal → My Complaints to reply. Your complaint will not be forwarded further until you respond.\n\nBest regards,\nIIT Dharwad Student Welfare`
      );

      return res.status(200).json({ message: "Query sent to student successfully." });
    }
  } catch (error) {
    console.error("handleComplaintAction error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. REPLY TO WELFARE QUERY (student)
//    On reply: query status → Answered, role status → Pending (re-appears in queue)
// ─────────────────────────────────────────────────────────────────────────────
export const replyToWelfareQuery = async (req, res) => {
  const { complaintMongoId, queryId, reply } = req.body;
  try {
    if (!complaintMongoId || !queryId || !reply) {
      return res.status(400).json({ message: "complaintMongoId, queryId, and reply are required." });
    }
    if (!reply.trim()) {
      return res.status(400).json({ message: "Reply cannot be empty." });
    }

    const complaint = await WelfareComplaint.findById(complaintMongoId);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });

    const queryIndex = complaint.queries.findIndex(
      (q) => q.queryId.toString() === queryId && q.status === "Unanswered"
    );
    if (queryIndex === -1) {
      return res.status(404).json({ message: "Query not found or already answered." });
    }

    const query = complaint.queries[queryIndex];
    const now   = new Date();

    complaint.queries[queryIndex].studentReply = reply.trim();
    complaint.queries[queryIndex].repliedAt    = now;
    complaint.queries[queryIndex].status       = "Answered";

    // Revert role's approval status back to "Pending" so it re-appears in their queue
    const approvalIndex = complaint.approvals.findIndex((a) => a.role === query.askerRole);
    if (approvalIndex !== -1) {
      complaint.approvals[approvalIndex].status = "Pending";
    }

    await complaint.save();

    // Notify the role that raised the query
    const roleEmail = getWelfareEmail(query.askerRole);
    await sendEmail(
      roleEmail,
      `Student Has Replied to Your Query [${complaint.complaintId}]`,
      `The student has replied to your query on complaint "${complaint.title}" (ID: ${complaint.complaintId}).\n\nYour question : ${query.questionText}\nStudent reply : ${reply}\n\nPlease log in to the portal to review the reply and take action.\n\nBest regards,\nIIT Dharwad Student Welfare System`
    );

    res.status(200).json({ message: "Reply submitted successfully." });
  } catch (error) {
    console.error("replyToWelfareQuery error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET COMPLAINT BY ID (full detail — used by all roles and student)
// ─────────────────────────────────────────────────────────────────────────────
export const getComplaintById = async (req, res) => {
  const { id } = req.params;
  try {
    const complaint = await WelfareComplaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });
    res.status(200).json({ complaint });
  } catch (error) {
    console.error("getComplaintById error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET COMPLAINTS FOR SW OFFICE
//    Shows complaints where either:
//    - fineInvolved === true (mess/canteen flow)
//    - purchaseMadeForRepair === true (hostel flow)
//    SW Office is read-only — no actions available, just record-keeping visibility
// ─────────────────────────────────────────────────────────────────────────────
export const getComplaintsForSWO = async (req, res) => {
  try {
    const complaints = await WelfareComplaint.find({
      $or: [{ fineInvolved: true }, { purchaseMadeForRepair: true }],
    }).sort({ createdAt: -1 });

    res.status(200).json({ complaints });
  } catch (error) {
    console.error("getComplaintsForSWO error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
