import mongoose from "mongoose";

const Schema = mongoose.Schema;

const eventApprovalSchema = new Schema(
  {
    userID: { type: String, required: true },
    eventName: { type: String, required: true },
    partOfGymkhanaCalendar: { type: String, required: true },
    eventType: { type: String }, // Optional field for tracking event type
    clubName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    semester: { type: String, required: false }, // Semester field (e.g., "Fall 2024", "Spring 2025")
    academicYear: { type: String, required: false }, // Academic year (e.g., "2024-2025")
    eventVenue: { type: String, required: true },
    sourceOfBudget: { type: String, required: true },
    estimatedBudget: { type: Number, required: true },
    nameOfTheOrganizer: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    requirements: { type: [String], required: false },
    anyAdditionalAmenities: { type: String },
    eventDescription: { type: String, required: true },
    internalParticipants: { type: Number, required: true },
    externalParticipants: { type: Number, required: true },
    listOfCollaboratingOrganizations: { type: String, default: "N/A" },
    // Budget breakup array of objects with expenseHead and estimatedAmount
    budgetBreakup: [
      {
        expenseHead: { type: String, required: true },
        estimatedAmount: { type: Number, required: true }
      }
    ],
    approvals: [
      {
        role: {
          type: String,
          enum: [
            "club-secretary",
            "general-secretary",
            "treasurer",
            "president",
            "faculty-in-charge",
            "associate-dean",
            "dean"
          ],
          required: true,
        },
        status: {
          type: String,
          enum: [
            "Pending",
            "Approved",
            "Rejected",
            "Query",
            "Edited",
            "Closed",
          ],
          default: "Pending",
        },
        comment: { type: String, required: false }, // Optional comment for feedback
      },
    ],
    queries: [
      {
        queryId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        askerRole: {
          type: String,
          enum: [
            "general-secretary",
            "treasurer",
            "president",
            "faculty-in-charge",
            "associate-dean",
            "dean",
            "ARSW",
          ],
          required: true,
        },
        queryText: { type: String, required: true },
        responderEmail: { type: String, required: true }, // Email of the organizer who should respond
        response: { type: String, required: false },
        status: {
          type: String,
          enum: ["Pending", "Answered"],
          default: "Pending",
        },
        raisedAt: { type: Date, default: Date.now },
        answeredAt: { type: Date, required: false },
        isPostApprovalQuery: { type: Boolean, default: false }, // Flag for queries raised after approval
      },
    ],
    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    closedBy: { type: String, required: false }, // Name of the person who closed the event
    closedAt: { type: Date, required: false }, // Date when the event was closed
    // Version history for tracking edits
    editHistory: [
      {
        editedAt: { type: Date, default: Date.now },
        editedBy: { type: String, required: true }, // User ID of the editor
        changes: { type: Map, of: Schema.Types.Mixed }, // Field changes (old value -> new value)
      },
    ],
  },
  { timestamps: true }
);

const EventApproval = mongoose.model("EventApproval", eventApprovalSchema);
export default EventApproval;
