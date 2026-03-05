import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  academicYear: { type: String, required: true, unique: true }, // e.g., "2025-2026"
  sequenceValue: { type: Number, default: 0 }
});

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
