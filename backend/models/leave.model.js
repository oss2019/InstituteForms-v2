import mongoose from "mongoose";

const Schema = mongoose.Schema;

const leaveApplicationSchema = new Schema({
  userID: { type: String, required: true }, 
  placeOfVisit: { type: String, required: true },
  reason: { type: String, required: true },
  proofOfTravel: { type: String, required: false },
  dateOfLeaving: { type: Date, required: true },
  arrivalDate: { type: Date, required: true },
  emergencyContact: { type: String, required: true },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected', 'Extension'] }, // Default status
  scanned: { type: Date, default: null },
}, {
});

const LeaveApplication = mongoose.model('LeaveApplication', leaveApplicationSchema);
export default LeaveApplication;
