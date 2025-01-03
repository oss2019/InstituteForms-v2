import EventApproval from "../models/event.model.js";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


const sendEmail = (to, subject, text) => {
  const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
  };

  console.log('Attempting to send email to:', to);

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error('Error sending email:', error);
      } else {
          console.log('Email sent:', info.response);
      }
  });
};


// Apply for Event approval

export const applyForEventApproval = async (req, res) => {
  try {
    const {
      name,
      designation,
      phoneNumber,
      email,
      dateFrom,
      dateTo,
      eventCategory,
      venue,
      helpRequired,
      description,
    } = req.body;

    const userID = req.body.userID; // Ensure this is retrieved correctly (e.g., from the request or session).

    // Fetch user details to ensure they exist
    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).json({ message: "User not found. Please log in again." });
    }

    // Check for any existing event approval in progress for this user
    const existingEvent = await EventApproval.findOne({
      userID,
      "approvals.status": { $in: ["Pending"] },
    });

    if (existingEvent) {
      return res
        .status(400)
        .json({ message: "You already have a pending event approval request." });
    }

    // Create the initial approvals array
    const approvals = [
      { role: "club-secretary", status: "Approved", comment: "" },
      { role: "general-secretary", status: "Pending", comment: "" },
      { role: "treasurer", status: "Pending", comment: "" },
      { role: "president", status: "Pending", comment: "" },
      { role: "faculty-in-charge", status: "Pending", comment: "" },
      { role: "associate-dean", status: "Pending", comment: "" },
    ];

    // Create a new event approval request
    const newEventApproval = new EventApproval({
      userID,
      name,
      designation,
      phoneNumber,
      email,
      dateFrom,
      dateTo,
      eventCategory,
      venue,
      helpRequired,
      description,
      approvals,
    });

     // Save the new approval
     const savedApproval = await newEventApproval.save();

     // Update the user's `eventApproval` field with the new approval ID
     user.eventApproval = savedApproval._id;
     await user.save();

    res.status(201).json({
      message: "Event approval request submitted successfully.",
      eventApproval: newEventApproval,
    });
  } catch (error) {
    console.error("Error submitting event approval request:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

//get pending approvals list

const roleHierarchy = ["club-secretary", "general-secretary", "treasurer", "president", "faculty-in-charge", "associate-dean"];

export const getPendingApprovals = async (req, res) => {
    const { role } = req.body;
  
    try {
      if (!role) {
        return res.status(400).json({ message: "Role is required." });
      }
  
      const roleIndex = roleHierarchy.indexOf(role);
      if (roleIndex === -1) {
        return res.status(400).json({ message: "Invalid role." });
      }
  
      // Fetch all event approvals where the current role has "Pending" status
      const pendingApprovals = await EventApproval.find({
        "approvals.role": role,
        "approvals.status": "Pending",
      });
  
      // Filter out approvals where the previous roles have not been "Approved"
      const validApprovals = pendingApprovals.filter((approval) => {
        const approvals = approval.approvals;
  
        // Check if all previous roles have "Approved" status
        const previousRolesApproved = roleHierarchy
          .slice(0, roleIndex) // Get roles before the current role
          .every((prevRole) => {
            // Check for each previous role if its status is "Approved"
            const roleApproval = approvals.find((app) => app.role === prevRole);
            return roleApproval && roleApproval.status === "Approved";
          });
  
        return previousRolesApproved;
      });
  
      res.status(200).json(validApprovals);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  