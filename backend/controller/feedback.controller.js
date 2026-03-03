import { MessFeedback, CanteenFeedback, AccommodationRequest } from "../models/feedback.model.js";

// ─── MESS FEEDBACK ────────────────────────────────────────────────────────────

export const submitMessFeedback = async (req, res) => {
  try {
    const feedback = new MessFeedback(req.body);
    await feedback.save();
    res.status(201).json({ message: "Mess feedback submitted successfully.", data: feedback });
  } catch (error) {
    console.error("submitMessFeedback error:", error);
    res.status(500).json({ message: "Failed to submit mess feedback.", error: error.message });
  }
};

export const getMessFeedbacks = async (req, res) => {
  try {
    const feedbacks = await MessFeedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mess feedbacks." });
  }
};

export const updateMessFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const updated = await MessFeedback.findByIdAndUpdate(
      id,
      { status, adminNote },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Feedback not found." });
    res.status(200).json({ message: "Status updated.", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update mess feedback." });
  }
};

// ─── CANTEEN FEEDBACK ─────────────────────────────────────────────────────────

export const submitCanteenFeedback = async (req, res) => {
  try {
    const feedback = new CanteenFeedback(req.body);
    await feedback.save();
    res.status(201).json({ message: "Canteen feedback submitted successfully.", data: feedback });
  } catch (error) {
    console.error("submitCanteenFeedback error:", error);
    res.status(500).json({ message: "Failed to submit canteen feedback.", error: error.message });
  }
};

export const getCanteenFeedbacks = async (req, res) => {
  try {
    const feedbacks = await CanteenFeedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch canteen feedbacks." });
  }
};

export const updateCanteenFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const updated = await CanteenFeedback.findByIdAndUpdate(
      id,
      { status, adminNote },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Feedback not found." });
    res.status(200).json({ message: "Status updated.", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update canteen feedback." });
  }
};

// ─── ACCOMMODATION ────────────────────────────────────────────────────────────

export const submitAccommodationRequest = async (req, res) => {
  try {
    const request = new AccommodationRequest(req.body);
    await request.save();
    res.status(201).json({ message: "Accommodation request submitted successfully.", data: request });
  } catch (error) {
    console.error("submitAccommodationRequest error:", error);
    res.status(500).json({ message: "Failed to submit accommodation request.", error: error.message });
  }
};

export const getAccommodationRequests = async (req, res) => {
  try {
    const requests = await AccommodationRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch accommodation requests." });
  }
};

export const updateAccommodationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const updated = await AccommodationRequest.findByIdAndUpdate(
      id,
      { status, adminNote },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Request not found." });
    res.status(200).json({ message: "Status updated.", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update accommodation request." });
  }
};
