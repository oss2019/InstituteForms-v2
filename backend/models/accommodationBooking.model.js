import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingQuerySchema = new Schema(
  {
    queryId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    askerRole: { type: String, required: true },
    questionText: { type: String, required: true },
    studentReply: { type: String, default: "" },
    repliedAt: { type: Date, default: null },
    status: { type: String, enum: ["Unanswered", "Answered"], default: "Unanswered" },
    raisedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const approvalStepSchema = new Schema(
  {
    role: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Queried"], default: "Pending" },
    remark: { type: String, default: "" },
    arrivedAt: { type: Date, default: null },
    actionAt: { type: Date, default: null },
  },
  { _id: false }
);

const accommodationBookingSchema = new Schema(
  {
    bookingId: { type: String, unique: true, sparse: true },

    userId: { type: String, required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },

    fullName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    branch: { type: String, required: true },
    courseOfStudy: { type: String, required: true },
    hostelBlock: { type: String, enum: ["Hostel 1", "Hostel 2"], required: true },
    hostelRoomNumber: { type: String, required: true },
    emailId: { type: String, required: true },
    contactNumber: { type: String, required: true },

    immediateFamilyName: { type: String, required: true },
    totalIndividuals: { type: Number, min: 1, required: true },
    numberOfRoomsRequired: { type: Number, min: 1, required: true },
    roomOccupancyType: { type: String, enum: ["Single", "Double"], required: true },
    arrivalDateTime: { type: Date, required: true },
    departureDateTime: { type: Date, required: true },
    purposeOfVisit: { type: String, required: true },
    parentsAddressWithMobile: { type: String, required: true },

    bookingStatus: { type: String, enum: ["Pending", "Approved"], default: "Pending" },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: "" },

    approvals: [approvalStepSchema],
    queries: [bookingQuerySchema],
  },
  { timestamps: true }
);

const accommodationBookingSettingsSchema = new Schema(
  {
    singleOccupancyPrice: { type: Number, default: 1500, min: 0 },
    doubleOccupancyPrice: { type: Number, default: 2000, min: 0 },
    checkInTime: { type: String, default: "12:00 PM" },
    checkOutTime: { type: String, default: "11:00 AM" },
    updatedByRole: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AccommodationBooking = mongoose.model("AccommodationBooking", accommodationBookingSchema);
export const AccommodationBookingSettings = mongoose.model("AccommodationBookingSettings", accommodationBookingSettingsSchema);
