import mongoose from "mongoose";

const Schema = mongoose.Schema;

const eventApprovalSchema = new Schema({
  userID: { type: String, required: true },
  name: { type: String, required: true },
  designation: { type: String, required: true },
  phoneNumber: { type: String, required: false },
  email: { type: String, required: false },
  dateFrom: { type: Date, required: true },
  dateTo: { type: Date, required: true },
  eventCategory: { type: String, required: true },
  venue: { type: String, required: true },
  helpRequired: { type: String, required: true },
  description: { type: String, required: true },
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
        required: false,
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
