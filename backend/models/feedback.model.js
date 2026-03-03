import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── MESS FEEDBACK ────────────────────────────────────────────────────────────
const messFeedbackSchema = new Schema(
  {
    studentEmail: { type: String, required: true },
    studentName:  { type: String, required: true },

    mealType:     { type: String, enum: ["Breakfast","Lunch","Snacks","Dinner"], required: true },
    date:         { type: Date, default: Date.now },

    // Ratings 1-5
    overallRating:    { type: Number, min: 1, max: 5, required: true },
    foodQuality:      { type: Number, min: 1, max: 5, required: true },
    hygiene:          { type: Number, min: 1, max: 5, required: true },
    serviceSpeed:     { type: Number, min: 1, max: 5, required: true },
    portionSize:      { type: Number, min: 1, max: 5, required: true },
    valueForMoney:    { type: Number, min: 1, max: 5, required: true },

    // Checkboxes (array of issue strings)
    issues: [{
      type: String,
      enum: [
        "Cold / Lukewarm Food",
        "Undercooked Items",
        "Overcooked / Burnt Food",
        "Insufficient Quantity",
        "Lack of Variety",
        "Repetitive Menu",
        "Poor Hygiene in Serving Area",
        "Unclean Utensils",
        "Long Queue / Slow Service",
        "Rude Staff Behaviour",
        "Tasteless / Bland Food",
        "High Salt / Spice",
        "Stale Food",
        "Foreign Objects in Food",
        "Other",
      ],
    }],

    specificDishFeedback: { type: String, default: "" }, // which dish, comment
    suggestions:          { type: String, default: "" },
    wouldRecommendChange: { type: String, enum: ["Strongly Agree","Agree","Neutral","Disagree","Strongly Disagree"], default: "Neutral" },

    status: { type: String, enum: ["Pending","Reviewed","Resolved"], default: "Pending" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

// ─── CANTEEN FEEDBACK ─────────────────────────────────────────────────────────
const canteenFeedbackSchema = new Schema(
  {
    studentEmail: { type: String, required: true },
    studentName:  { type: String, required: true },

    outletName:   { type: String, required: true }, // e.g. "Main Canteen", "Tea Stall"
    visitDate:    { type: Date, default: Date.now },
    itemsPurchased: { type: String, required: true },

    // Ratings 1-5
    foodQuality:    { type: Number, min: 1, max: 5, required: true },
    priceFairness:  { type: Number, min: 1, max: 5, required: true },
    hygieneRating:  { type: Number, min: 1, max: 5, required: true },
    staffBehaviour: { type: Number, min: 1, max: 5, required: true },
    overallRating:  { type: Number, min: 1, max: 5, required: true },

    issues: [{
      type: String,
      enum: [
        "Overpriced Items",
        "Poor Food Quality",
        "Unhygienic Conditions",
        "Expired / Stale Products",
        "Limited Healthy Options",
        "Cash Only — No UPI",
        "Rude Staff",
        "Inadequate Seating",
        "Slow Service",
        "Inaccurate Billing",
        "No Nutritional Info",
        "Other",
      ],
    }],

    suggestions:     { type: String, default: "" },
    additionalComments: { type: String, default: "" },

    status:    { type: String, enum: ["Pending","Reviewed","Resolved"], default: "Pending" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

// ─── ACCOMMODATION REQUEST ─────────────────────────────────────────────────────
const accommodationSchema = new Schema(
  {
    studentEmail:  { type: String, required: true },
    studentName:   { type: String, required: true },
    rollNumber:    { type: String, required: true },
    contactNumber: { type: String, required: true },

    hostelBlock:   { type: String, required: true }, // e.g. "H1", "H2", "Girls Hostel"
    roomNumber:    { type: String, required: true },

    issueCategory: {
      type: String,
      required: true,
      enum: [
        "Plumbing",
        "Electrical",
        "Furniture / Fixtures",
        "Cleanliness",
        "Pest Control",
        "Civil / Structural",
        "Network / Wi-Fi",
        "Security",
        "Laundry",
        "Water Supply",
        "Heating / Cooling",
        "Other",
      ],
    },

    issueDescription: { type: String, required: true },
    priorityLevel: { type: String, enum: ["Low","Medium","High","Urgent"], default: "Medium" },

    // When student prefers it resolved
    preferredResolutionDate: { type: Date, required: false },

    // For additional media (URL / base64 string)
    attachmentUrl: { type: String, default: "" },

    contactPreference: {
      type: String,
      enum: ["Email","Phone","WhatsApp","In-Person"],
      default: "Email",
    },

    status:    { type: String, enum: ["Submitted","In Progress","Resolved","Closed"], default: "Submitted" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export const MessFeedback        = mongoose.model("MessFeedback",        messFeedbackSchema);
export const CanteenFeedback     = mongoose.model("CanteenFeedback",     canteenFeedbackSchema);
export const AccommodationRequest = mongoose.model("AccommodationRequest", accommodationSchema);
