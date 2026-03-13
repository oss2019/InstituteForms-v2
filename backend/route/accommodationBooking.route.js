import express from "express";
import {
  submitAccommodationBooking,
  getMyAccommodationBookings,
  getAccommodationActionNeeded,
  getAllAccommodationBookingsForRole,
  handleAccommodationBookingAction,
  replyToAccommodationBookingQuery,
  getAccommodationBookingSettings,
  upsertAccommodationBookingSettings,
} from "../controller/accommodationBooking.controller.js";

const router = express.Router();

// Student
router.post("/submit", submitAccommodationBooking);
router.post("/my", getMyAccommodationBookings);
router.post("/query/reply", replyToAccommodationBookingQuery);

// Staff
router.post("/action-needed", getAccommodationActionNeeded);
router.post("/all-for-role", getAllAccommodationBookingsForRole);
router.post("/action/:id", handleAccommodationBookingAction);

// Transit settings
router.get("/settings", getAccommodationBookingSettings);
router.post("/settings/update", upsertAccommodationBookingSettings);

export default router;
