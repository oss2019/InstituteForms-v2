import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventApproval",
      required: true,
    },

    eventName: {
      type: String,
      required: true,
      trim: true,
    },

    referenceNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // null means the expenditure belongs
    // directly to the council budget.
    clubName: {
      type: String,
      default: null,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    spentAt: {
      type: Date,
      default: Date.now,
    },

    remark: {
      type: String,
      default: "",
      trim: true,
    },

    enteredBy: {
      type: String,
      required: true,
    },

    enteredByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  }
);


const clubSchema = new mongoose.Schema(
  {
    clubName: {
      type: String,
      required: true,
      trim: true,
    },

    approvedBudget: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    _id: true,
  }
);


const budgetSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },

    councilName: {
      type: String,
      required: true,
      trim: true,
    },

    councilBudget: {
      approved: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },

    clubs: {
      type: [clubSchema],
      default: [],
    },

    transactions: {
      type: [transactionSchema],
      default: [],
    },

    createdBy: {
      type: String,
      required: true,
    },

    updatedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);


// One council can occur only once per academic year.
budgetSchema.index(
  {
    academicYear: 1,
    councilName: 1,
  },
  {
    unique: true,
  }
);


const Budget = mongoose.model(
  "Budget",
  budgetSchema
);

export default Budget;