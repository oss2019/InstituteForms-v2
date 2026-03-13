import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── WELFARE COMPLAINT ────────────────────────────────────────────────────────
// Single model covering Mess / Canteen / Hostel complaints
// complaintType field drives which hierarchy is used
// ─────────────────────────────────────────────────────────────────────────────

const welfareComplaintSchema = new Schema(
  {
    // ── Complaint identity
    complaintId:   { type: String, unique: true, sparse: true }, // e.g. IITDH/MESS/2026/001
    complaintType: { type: String, enum: ["mess", "canteen", "hostel", "accommodation"], required: true },

    // ── Student info
    userId:       { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentName:  { type: String, required: true },

    // ── Complaint basics (common to all types)
    title:       { type: String, required: true },
    description: { type: String, required: true },
    severity:    { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },

    // ── Mess-specific fields (optional — only set for mess complaints)
    mealType:             { type: String, enum: ["Breakfast", "Lunch", "Snacks", "Dinner"] },
    mealDate:             { type: Date },
    overallRating:        { type: Number, min: 1, max: 5 },
    foodQuality:          { type: Number, min: 1, max: 5 },
    hygiene:              { type: Number, min: 1, max: 5 },
    serviceSpeed:         { type: Number, min: 1, max: 5 },
    portionSize:          { type: Number, min: 1, max: 5 },
    valueForMoney:        { type: Number, min: 1, max: 5 },
    issues:               [{ type: String }],
    specificDishFeedback: { type: String, default: "" },
    suggestions:          { type: String, default: "" },
    wouldRecommendChange: { type: String, default: "" },

    // ── Canteen-specific fields (optional — only set for canteen complaints)
    outletName:         { type: String },
    visitDate:          { type: Date },
    itemsPurchased:     { type: String },
    priceFairness:      { type: Number, min: 1, max: 5 },
    hygieneRating:      { type: Number, min: 1, max: 5 },
    staffBehaviour:     { type: Number, min: 1, max: 5 },
    additionalComments: { type: String, default: "" },

    // ── Hostel-specific fields (optional — only set for hostel complaints)
    rollNumber:              { type: String },
    contactNumber:           { type: String },
    hostelBlock:             { type: String },
    accommodationBlock:      { type: String }, // legacy alias kept for backward compatibility
    roomNumber:              { type: String },
    issueCategory:           { type: String },
    issueDescription:        { type: String },
    priorityLevel:           { type: String, enum: ["Low", "Medium", "High", "Urgent"] },
    preferredResolutionDate: { type: Date },
    attachmentUrl:           { type: String, default: "" },
    contactPreference:       { type: String, enum: ["Email", "Phone", "WhatsApp", "In-Person"] },

    // ── Top-level workflow status
    status:      { type: String, enum: ["Pending", "Resolved", "Closed"], default: "Pending" },
    resolvedAt:  { type: Date },
    resolvedBy:  { type: String, default: "" }, // role that resolved it

    // ── Fine ticker (associate-dean only — no fine logic, just a flag + note for SW Office visibility)
    fineInvolved: { type: Boolean, default: false },
    fineNote:     { type: String, default: "" },

    // ── Hostel purchase ticker (adean-hostel only)
    purchaseMadeForRepair: { type: Boolean, default: false },
    purchaseNote:          { type: String, default: "" },

    // ── Sequential approval chain
    // arrivedAt: when the complaint was assigned to this role (forwarded to them)
    // actionAt:  when this role took an action (resolve / escalate / query)
    approvals: [
      {
        role:      { type: String, required: true },
        status:    { type: String, enum: ["Pending", "Resolved", "Escalated", "Queried"], default: "Pending" },
        remark:    { type: String, default: "" },
        arrivedAt: { type: Date, default: null },
        actionAt:  { type: Date, default: null },
      },
    ],

    // ── Query thread (role asks student → student replies)
    queries: [
      {
        queryId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        askerRole:    { type: String, required: true },
        questionText: { type: String, required: true },
        studentReply: { type: String, default: "" },
        repliedAt:    { type: Date, default: null },
        status:       { type: String, enum: ["Unanswered", "Answered"], default: "Unanswered" },
        raisedAt:     { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const WelfareComplaint = mongoose.model("WelfareComplaint", welfareComplaintSchema);
