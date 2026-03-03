import express from "express";
import {
  submitMessFeedback,
  getMessFeedbacks,
  updateMessFeedbackStatus,
  submitCanteenFeedback,
  getCanteenFeedbacks,
  updateCanteenFeedbackStatus,
  submitAccommodationRequest,
  getAccommodationRequests,
  updateAccommodationStatus,
} from "../controller/feedback.controller.js";

const router = express.Router();

// ── Mess
router.post("/mess",          submitMessFeedback);
router.get("/mess",           getMessFeedbacks);
router.put("/mess/:id",       updateMessFeedbackStatus);

// ── Canteen
router.post("/canteen",       submitCanteenFeedback);
router.get("/canteen",        getCanteenFeedbacks);
router.put("/canteen/:id",    updateCanteenFeedbackStatus);

// ── Accommodation
router.post("/accommodation",     submitAccommodationRequest);
router.get("/accommodation",      getAccommodationRequests);
router.put("/accommodation/:id",  updateAccommodationStatus);

export default router;
