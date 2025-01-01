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
  status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected', 'Extension'] }, // Default status
}, {
});

const EventApproval = mongoose.model('EventApproval', eventApprovalSchema);
export default EventApproval;
