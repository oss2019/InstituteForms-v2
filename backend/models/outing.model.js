import mongoose from "mongoose";

const Schema = mongoose.Schema;

const outingRequestSchema = new Schema({
  userID: { type: String, required: true }, 
  placeOfVisit: { type: String, required: true },
  reason: { type: String, required: true },
  outTime: { type: Date, required: false },
  inTime: { type: Date, required: false },
  emergencyContact: {type: String, required: true},
  status: { type: String, default: 'Approved'},
  scanned: { type: Date, default: null }
}, 
);

const OutingRequest = mongoose.model('OutingRequest', outingRequestSchema);
export default OutingRequest;