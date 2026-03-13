import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {
  AccommodationBooking,
  AccommodationBookingSettings,
} from "../models/accommodationBooking.model.js";

dotenv.config();

const BOOKING_HIERARCHY = ["transit-facility", "associate-dean", "dean"];
const TEST_EMAIL = "mc24bt017@iitdh.ac.in";

const bookingRoleEmails = [
  { role: "transit-facility", email: TEST_EMAIL },
  { role: "associate-dean", email: TEST_EMAIL },
  { role: "dean", email: TEST_EMAIL },
];

const getRoleEmail = (role) => bookingRoleEmails.find((r) => r.role === role)?.email || null;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  if (!to || to.includes("PLACEHOLDER")) return;
  transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text }, (error) => {
    if (error) console.error("Accommodation booking email error:", error);
  });
};

const ensureSettings = async () => {
  let settings = await AccommodationBookingSettings.findOne();
  if (!settings) {
    settings = await AccommodationBookingSettings.create({});
  }
  return settings;
};

const generateBookingId = async () => {
  const year = new Date().getFullYear();
  const prefix = `IITDH/MBG/${year}/`;
  const count = await AccommodationBooking.countDocuments({ bookingId: { $regex: `^${prefix}` } });
  const padded = String(count + 1).padStart(3, "0");
  return `${prefix}${padded}`;
};

export const getAccommodationBookingSettings = async (_req, res) => {
  try {
    const settings = await ensureSettings();
    res.status(200).json({ settings });
  } catch (error) {
    console.error("getAccommodationBookingSettings error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const upsertAccommodationBookingSettings = async (req, res) => {
  try {
    const { role, singleOccupancyPrice, doubleOccupancyPrice, checkInTime, checkOutTime } = req.body;
    if (role !== "transit-facility") {
      return res.status(403).json({ message: "Only transit-facility can update pricing/settings." });
    }
    if (singleOccupancyPrice === undefined || doubleOccupancyPrice === undefined || !checkInTime || !checkOutTime) {
      return res.status(400).json({ message: "singleOccupancyPrice, doubleOccupancyPrice, checkInTime and checkOutTime are required." });
    }

    const settings = await ensureSettings();
    settings.singleOccupancyPrice = Number(singleOccupancyPrice);
    settings.doubleOccupancyPrice = Number(doubleOccupancyPrice);
    settings.checkInTime = checkInTime;
    settings.checkOutTime = checkOutTime;
    settings.updatedByRole = role;
    settings.updatedAt = new Date();
    await settings.save();

    res.status(200).json({ message: "Accommodation booking settings updated.", settings });
  } catch (error) {
    console.error("upsertAccommodationBookingSettings error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const submitAccommodationBooking = async (req, res) => {
  try {
    const {
      userId,
      studentName,
      studentEmail,
      fullName,
      rollNumber,
      branch,
      courseOfStudy,
      hostelBlock,
      hostelRoomNumber,
      emailId,
      contactNumber,
      immediateFamilyName,
      totalIndividuals,
      numberOfRoomsRequired,
      roomOccupancyType,
      arrivalDateTime,
      departureDateTime,
      purposeOfVisit,
      parentsAddressWithMobile,
    } = req.body;

    const required = [
      userId,
      studentName,
      studentEmail,
      fullName,
      rollNumber,
      branch,
      courseOfStudy,
      hostelBlock,
      hostelRoomNumber,
      emailId,
      contactNumber,
      immediateFamilyName,
      totalIndividuals,
      numberOfRoomsRequired,
      roomOccupancyType,
      arrivalDateTime,
      departureDateTime,
      purposeOfVisit,
      parentsAddressWithMobile,
    ];

    if (required.some((x) => x === undefined || x === null || x === "")) {
      return res.status(400).json({ message: "All fields are mandatory for accommodation booking." });
    }

    if (!/^\d{10}$/.test(String(contactNumber))) {
      return res.status(400).json({ message: "Contact number must be exactly 10 digits." });
    }

    const bookingId = await generateBookingId();
    const now = new Date();

    const approvals = BOOKING_HIERARCHY.map((role, idx) => ({
      role,
      status: "Pending",
      remark: "",
      arrivedAt: idx === 0 ? now : null,
      actionAt: null,
    }));

    const booking = await AccommodationBooking.create({
      bookingId,
      userId,
      studentName,
      studentEmail,
      fullName,
      rollNumber,
      branch,
      courseOfStudy,
      hostelBlock,
      hostelRoomNumber,
      emailId,
      contactNumber,
      immediateFamilyName,
      totalIndividuals,
      numberOfRoomsRequired,
      roomOccupancyType,
      arrivalDateTime,
      departureDateTime,
      purposeOfVisit,
      parentsAddressWithMobile,
      approvals,
      bookingStatus: "Pending",
    });

    await sendEmail(
      getRoleEmail("transit-facility"),
      `New Mess Block Accommodation Booking [${bookingId}]`,
      `A new accommodation booking request has been submitted.\n\nBooking ID: ${bookingId}\nStudent: ${studentName} (${studentEmail})\nHostel Block: ${hostelBlock}\nRoom Type: ${roomOccupancyType}\nArrival: ${arrivalDateTime}\nDeparture: ${departureDateTime}`
    );

    await sendEmail(
      studentEmail,
      `Accommodation Booking Submitted [${bookingId}]`,
      `Dear ${studentName},\n\nYour accommodation booking request has been submitted successfully.\n\nBooking ID: ${bookingId}\nCurrent Stage: Transit Facility\n\nYou can track status in My Bookings.`
    );

    res.status(201).json({ message: "Accommodation booking submitted successfully.", booking });
  } catch (error) {
    console.error("submitAccommodationBooking error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error.", errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getMyAccommodationBookings = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required." });
    const bookings = await AccommodationBooking.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ bookings });
  } catch (error) {
    console.error("getMyAccommodationBookings error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccommodationActionNeeded = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: "Role is required." });

    let bookings = await AccommodationBooking.find({
      "approvals.role": role,
      bookingStatus: "Pending",
    }).sort({ createdAt: -1 });

    bookings = bookings.filter((b) => {
      const entry = b.approvals.find((a) => a.role === role);
      if (!entry) return false;
      if (!entry.arrivedAt) return false;
      return entry.status === "Pending" || entry.status === "Queried";
    });

    bookings = bookings.filter((b) => {
      const myIndex = BOOKING_HIERARCHY.indexOf(role);
      if (myIndex === -1) return false;
      return BOOKING_HIERARCHY.slice(0, myIndex).every((prevRole) => {
        const prev = b.approvals.find((a) => a.role === prevRole);
        return prev && prev.status === "Approved";
      });
    });

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("getAccommodationActionNeeded error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAllAccommodationBookingsForRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: "Role is required." });

    if (!BOOKING_HIERARCHY.includes(role) && role !== "sw-office") {
      return res.status(200).json({ bookings: [] });
    }

    const bookings = await AccommodationBooking.find().sort({ createdAt: -1 });
    res.status(200).json({ bookings });
  } catch (error) {
    console.error("getAllAccommodationBookingsForRole error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const handleAccommodationBookingAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, action, remark } = req.body;

    if (!role || !action) {
      return res.status(400).json({ message: "role and action are required." });
    }
    if (!["approve", "query"].includes(action)) {
      return res.status(400).json({ message: "action must be 'approve' or 'query'." });
    }

    const booking = await AccommodationBooking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    const myIndex = BOOKING_HIERARCHY.indexOf(role);
    if (myIndex === -1) {
      return res.status(403).json({ message: "This role is not part of booking workflow." });
    }

    const approvalIndex = booking.approvals.findIndex((a) => a.role === role);
    if (approvalIndex === -1) {
      return res.status(400).json({ message: "No approval entry found for this role." });
    }

    const entry = booking.approvals[approvalIndex];
    if (!entry.arrivedAt) {
      return res.status(400).json({ message: "This booking has not reached your role yet." });
    }
    if (entry.status !== "Pending" && entry.status !== "Queried") {
      return res.status(400).json({ message: "No pending action required from this role." });
    }

    const now = new Date();

    if (action === "query") {
      if (!remark || !remark.trim()) {
        return res.status(400).json({ message: "Question text is required for a query." });
      }

      booking.approvals[approvalIndex].status = "Queried";
      booking.queries.push({
        askerRole: role,
        questionText: remark.trim(),
        studentReply: "",
        status: "Unanswered",
        raisedAt: now,
      });
      await booking.save();

      await sendEmail(
        booking.studentEmail,
        `Query Raised on Accommodation Booking [${booking.bookingId}]`,
        `A query has been raised by ${role.replace(/-/g, " ")} on your booking ${booking.bookingId}.\n\nQuery:\n${remark}`
      );

      return res.status(200).json({ message: "Query sent to student successfully." });
    }

    // approve
    booking.approvals[approvalIndex].status = "Approved";
    booking.approvals[approvalIndex].remark = remark || "";
    booking.approvals[approvalIndex].actionAt = now;

    const nextRole = BOOKING_HIERARCHY[myIndex + 1];
    if (nextRole) {
      const nextApprovalIndex = booking.approvals.findIndex((a) => a.role === nextRole);
      if (nextApprovalIndex !== -1) {
        booking.approvals[nextApprovalIndex].arrivedAt = now;
      }

      await booking.save();

      await sendEmail(
        getRoleEmail(nextRole),
        `Accommodation Booking Forwarded to You [${booking.bookingId}]`,
        `Booking ${booking.bookingId} has been approved by ${role.replace(/-/g, " ")} and forwarded to your stage.`
      );

      return res.status(200).json({ message: "Booking approved and forwarded." });
    }

    booking.bookingStatus = "Approved";
    booking.approvedAt = now;
    booking.approvedBy = role;
    await booking.save();

    await sendEmail(
      booking.studentEmail,
      `Accommodation Booking Approved [${booking.bookingId}]`,
      `Your accommodation booking ${booking.bookingId} has been fully approved.`
    );

    return res.status(200).json({ message: "Booking approved successfully." });
  } catch (error) {
    console.error("handleAccommodationBookingAction error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const replyToAccommodationBookingQuery = async (req, res) => {
  try {
    const { bookingMongoId, queryId, reply } = req.body;
    if (!bookingMongoId || !queryId || !reply) {
      return res.status(400).json({ message: "bookingMongoId, queryId, and reply are required." });
    }

    const booking = await AccommodationBooking.findById(bookingMongoId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    const queryIndex = booking.queries.findIndex(
      (q) => q.queryId.toString() === queryId && q.status === "Unanswered"
    );
    if (queryIndex === -1) {
      return res.status(404).json({ message: "Query not found or already answered." });
    }

    const now = new Date();
    const query = booking.queries[queryIndex];
    booking.queries[queryIndex].studentReply = reply.trim();
    booking.queries[queryIndex].repliedAt = now;
    booking.queries[queryIndex].status = "Answered";

    const approvalIndex = booking.approvals.findIndex((a) => a.role === query.askerRole);
    if (approvalIndex !== -1) {
      booking.approvals[approvalIndex].status = "Pending";
    }

    await booking.save();

    await sendEmail(
      getRoleEmail(query.askerRole),
      `Student Replied to Booking Query [${booking.bookingId}]`,
      `Student reply on booking ${booking.bookingId}:\n\n${reply}`
    );

    res.status(200).json({ message: "Reply submitted successfully." });
  } catch (error) {
    console.error("replyToAccommodationBookingQuery error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
