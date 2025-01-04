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
      userID,
      eventName,
      partOfGymkhanaCalendar,
      eventType,
      clubName,
      startDate,
      endDate,
      eventVenue,
      sourceOfBudget,
      estimatedBudget,
      nameOfTheOrganizer,
      designation,
      email,
      phoneNumber,
      requirements,
      anyAdditionalAmenities,
      eventDescription,
      internalParticipants,
      externalParticipants,
      listOfCollaboratingOrganizations,
    } = req.body;

    console.log("Incoming Payload:", req.body);

    const userID_ = req.body.userID; // Ensure this is retrieved correctly (e.g., from the request or session).

    // Fetch user details to ensure they exist
    const user = await User.findById(userID_);
    if (!user) {
      return res.status(404).json({ message: "User not found. Please log in again." });
    }

    // Check for any existing event approval in progress for this user
    const existingEvent = await EventApproval.findOne({
      userID_,
      "approvals.status": { $in: ["Pending"] },
    });

    if (existingEvent) {
      return res.status(400).json({ message: "You already have a pending event approval request." });
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
      eventName,
      partOfGymkhanaCalendar,
      eventType,
      clubName,
      startDate,
      endDate,
      eventVenue,
      sourceOfBudget,
      estimatedBudget,
      nameOfTheOrganizer,
      designation,
      email,
      phoneNumber,
      requirements,
      anyAdditionalAmenities,
      eventDescription,
      internalParticipants,
      externalParticipants,
      listOfCollaboratingOrganizations,
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
    if (error.name === "ValidationError") {
      console.error("Validation Error:", error.errors);
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error submitting event approval request:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

//get pending approvals list
//put in staff dashboard Pending section

const roleHierarchy = ["club-secretary", "general-secretary", "treasurer", "president", "faculty-in-charge", "associate-dean"];

export const getPendingApprovals = async (req, res) => {
  const { role, category } = req.body;

  try {
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    const roleIndex = roleHierarchy.indexOf(role);
    if (roleIndex === -1) {
      return res.status(400).json({ message: "Invalid role." });
    }

    // Find all applications with the specified role
    let pendingApprovals = await EventApproval.find({
      "approvals.role": role,
    });

    // If no applications are found, return a response and exit
    if (pendingApprovals.length === 0) {
      return res.status(200).json({ message: "No applications found." });
    }

    // Filter out those with a status of 'Pending'
    pendingApprovals = pendingApprovals.filter((approval) => {
      const approvalStatus = approval.approvals.find(
        (app) => app.role === role
      );
      return approvalStatus && approvalStatus.status === "Pending";
    });

    // Ensure previous roles in the hierarchy are approved
    pendingApprovals = pendingApprovals.filter((approval) => {
      const approvals = approval.approvals;
      const previousRolesApproved = roleHierarchy
        .slice(0, roleIndex) // Slice roles before the current one
        .every((prevRole) => {
          const roleApproval = approvals.find((app) => app.role === prevRole);
          return roleApproval && roleApproval.status === "Approved";
        });

      return previousRolesApproved;
    });

    // If 'general-secretary', filter by event category
    if (role === "general-secretary" && category) {
      pendingApprovals = pendingApprovals.filter(
        (approval) => approval.eventCategory === category
      );
    }

    // Return filtered pending approvals
    res.status(200).json(pendingApprovals);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getApprovedApplications = async (req, res) => {
  const { role, category } = req.body;

  try {
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    const roleIndex = roleHierarchy.indexOf(role);
    if (roleIndex === -1) {
      return res.status(400).json({ message: "Invalid role." });
    }

    // Find all applications with the specified role
    let approvedApplications = await EventApproval.find({
      "approvals.role": role,
    });

    // If no applications are found, return a response and exit
    if (approvedApplications.length === 0) {
      return res.status(200).json({ message: "No applications found." });
    }

    // Filter out those with a status of 'Approved'
    approvedApplications = approvedApplications.filter((approval) => {
      const approvalStatus = approval.approvals.find(
        (app) => app.role === role
      );
      return approvalStatus && approvalStatus.status === "Approved";
    });

    // If 'general-secretary', filter by event category
    if (role === "general-secretary" && category) {
      approvedApplications = approvedApplications.filter(
        (approval) => approval.eventCategory === category
      );
    }

    // Filter out applications whose `dateTo` is before the current date
    const currentDate = new Date();
    approvedApplications = approvedApplications.filter((approval) => {
      const dateTo = new Date(approval.dateTo);
      return currentDate <= dateTo; // Only include events that are not past their `dateTo`
    });

    // Return filtered approved applications
    res.status(200).json(approvedApplications);
  } catch (error) {
    console.error("Error fetching approved applications:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};









//approve an event function 

// Function to approve an application based on the role
export const approveApplication = async (req, res) => {
  const { applicationId, role } = req.body;

  try {
    // Check if the role is valid
    if (!role || !roleHierarchy.includes(role)) {
      return res.status(400).json({ message: "Invalid or missing role." });
    }

    // Find the event approval by applicationId
    const eventApproval = await EventApproval.findById(applicationId);
    if (!eventApproval) {
      return res.status(404).json({ message: "Event approval not found." });
    }

    // Find the index of the approval object corresponding to the given role
    const approvalIndex = eventApproval.approvals.findIndex(
      (approval) => approval.role === role && approval.status === "Pending"
    );

    if (approvalIndex === -1) {
      return res.status(400).json({ message: "No pending approval found for this role." });
    }

    // Update the status of the approval to "Approved"
    eventApproval.approvals[approvalIndex].status = "Approved";

    // Save the updated event approval document
    await eventApproval.save();

    // Optionally, you can also send a notification email or take further actions here
    res.status(200).json({ message: `${role} approved the application successfully.` });
  } catch (error) {
    console.error("Error approving application:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
