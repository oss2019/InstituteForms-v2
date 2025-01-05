import mongoose from "mongoose";

const Schema = mongoose.Schema;

const eventApprovalSchema = new Schema({
  userID: { type: String, required: true },
  eventName: { type: String, required: true },
  partOfGymkhanaCalendar: { type: String, required: true },
  eventType: { type: String }, // Optional field for tracking event type
  clubName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
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
        ],
        required: true,
      },
      status: {
        type: String,
        enum: ["Pending", "Approved", "Not Approved"],
        default: "Pending",
      },
      comment: { type: String, required: false }, // Optional comment for feedback
    },
  ],
}, { timestamps: true });

const EventApproval = mongoose.model('EventApproval', eventApprovalSchema);
export default EventApproval;
