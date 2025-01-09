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


//emails of all members
const roleEmails = [
  { role: "general-secretary-technical", email: "me23bt009@iitdh.ac.in" },
  { role: "general-secretary-cultural", email: "cs23bt028@iitdh.ac.in" },
  { role: "general-secretary-sports", email: "sports.secretary@example.com" },
  { role: "treasurer", email: "me23bt009@iitdh.ac.in" },
  { role: "president", email: "president@example.com" },
  { role: "faculty-in-charge", email: "faculty.incharge@example.com" },
  { role: "associate-dean", email: "associate.dean@example.com" },
];

const getEmailForRole = (role) => {
  const match = roleEmails.find((entry) => entry.role === role);
  return match ? match.email : null;
};
const getEmailForCategory = (category) => {
  const role = `general-secretary-${category.toLowerCase()}`;
  const match = roleEmails.find((entry) => entry.role === role);
  return match ? match.email : null;
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
    const  category  = req.body.eventType;
    const categoryEmail = getEmailForCategory(category);

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
    if (categoryEmail) {
      sendEmail(
        categoryEmail,
        `Event Approval Needed: ${eventName},`,
        `A new ${category} event approval request has been submitted. Please review it at your earliest convenience.`
      );
      console.log(`Email sent to ${categoryEmail} for ${category} event approval.`);
    } else {
      console.error(`No email found for category: ${category}`);
    }


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

export const getUserEvents = async (req, res) => {
  const { userID } = req.body;

  try {
    // Find events associated with the user's ID
    const events = await EventApproval.find({ userID });
    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found for this user." });
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching user events:", error.message);
    res.status(500).json({ message: "Internal server error." });
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
      return roleHierarchy.slice(0, roleIndex).every((prevRole) => {
        const prevApproval = approval.approvals.find((app) => app.role === prevRole);
        return prevApproval && prevApproval.status === "Approved";
      });
    });

    // If 'general-secretary', filter by event category
    if (role === "general-secretary" && category) {
      pendingApprovals = pendingApprovals.filter(
        (approval) => approval.eventType === category
      );
    }

    // Return filtered pending approvals
    res.status(200).json(pendingApprovals);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Function to fetch event details by ID
export const getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the event by ID
    const event = await EventApproval.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const getApprovedApplications = async (req, res) => {
  const { role, category, status} = req.body;

  console.log("Received role:", role);
  console.log("Received category:", category);

  try {
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    // Fetch only events with matching role and approved status
    let approvedApplications = await EventApproval.find({
      "approvals": {
        $elemMatch: {
          role: role,
          status: "Approved"
        }
      }
    });

    console.log("Initial approved applications:", approvedApplications);

    if (approvedApplications.length === 0) {
      return res.status(200).json([]);
    }

    // Filter by category if role is 'general-secretary'
    if (role === "general-secretary" && category) {
      approvedApplications = approvedApplications.filter(
        (approval) => approval.eventType === category
      );
    }

    // Filter out applications with `endDate` before the current date
    const currentDate = new Date();
    approvedApplications = approvedApplications.filter((approval) => {
      const endDate = new Date(approval.endDate);
      return currentDate <= endDate;
    });

    console.log("Final approved applications:", approvedApplications);
    res.status(200).json(approvedApplications);
  } catch (error) {
    console.error("Error fetching approved applications:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get Rejected Event Applications
export const getRejectedApplications = async (req, res) => {
  const { role, category } = req.body;

  console.log("Received role:", role);
  console.log("Received category:", category);

  try {
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    // Fetch only events with matching role and rejected status
    let rejectedApplications = await EventApproval.find({
      "approvals": {
        $elemMatch: {
          role: role,
          status: "Rejected"
        }
      }
    });

    console.log("Initial rejected applications:", rejectedApplications);

    if (rejectedApplications.length === 0) {
      return res.status(200).json([]);
    }

    // Filter by category if role is 'general-secretary'
    if (role === "general-secretary" && category) {
      rejectedApplications = rejectedApplications.filter(
        (approval) => approval.eventType === category
      );
    }

    // Filter out applications with `endDate` before the current date (optional)
    const currentDate = new Date();
    rejectedApplications = rejectedApplications.filter((approval) => {
      const endDate = new Date(approval.endDate);
      return currentDate <= endDate; // Only show future rejected events (optional logic)
    });

    console.log("Final rejected applications:", rejectedApplications);
    res.status(200).json(rejectedApplications);
  } catch (error) {
    console.error("Error fetching rejected applications:", error);
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
    const nextRoleIndex = roleHierarchy.indexOf(role) + 1;
    if (nextRoleIndex < roleHierarchy.length) {
      const nextRole = roleHierarchy[nextRoleIndex];
      
      sendEmail(
        `${getEmailForRole(nextRole)}`, // Replace with actual email
        `Event Approval Needed: ${eventApproval.eventName}`,
        `The event "${eventApproval.eventName}" has been approved by ${role}. It is now pending your review and approval.`
      ); 
  }

    // Save the updated event approval document
    await eventApproval.save();

    // Optionally, you can also send a notification email or take further actions here
    res.status(200).json({ message: `${role} approved the application successfully.` });
  } catch (error) {
    console.error("Error approving application:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// In your event.controller.js file

export const handleApprovalStatus = async (req, res) => {
  const { applicationId, role, status } = req.body;

  try {
    console.log("Received request:", { applicationId, role, status }); // Debug log

    if (!role || !['Approved', 'Rejected'].includes(status)) {
      console.log("Invalid role or status"); // Debug log
      return res.status(400).json({ message: "Invalid role or status." });
    }

    const eventApproval = await EventApproval.findById(applicationId);

    if (!eventApproval) {
      console.log("Event approval not found"); // Debug log
      return res.status(404).json({ message: "Event approval not found." });
    }

    const approvalIndex = eventApproval.approvals.findIndex(
      (app) => app.role === role && app.status === "Pending"
    );

    if (approvalIndex === -1) {
      console.log("No pending approval found for this role"); // Debug log
      return res.status(400).json({ message: "No pending approval found for this role." });
    }

    eventApproval.approvals[approvalIndex].status = status;
    const nextRoleIndex = roleHierarchy.indexOf(role) + 1;
    if (nextRoleIndex < roleHierarchy.length) {
      const nextRole = roleHierarchy[nextRoleIndex];
      
      sendEmail(
        `${getEmailForRole(nextRole)}`, // Replace with actual email
        `Event Approval Needed: ${eventApproval.eventName}`,
        `The event "${eventApproval.eventName}" has been approved by ${role}. It is now pending your review and approval.`
      ); 
  }
    await eventApproval.save();

    console.log("Application updated successfully:", { applicationId, status }); // Debug log
    res.status(200).json({ message: `Application ${status} successfully.` });
  } catch (error) {
    console.error("Error updating application status:", error); // Log full error
    res.status(500).json({ message: "Internal server error." });
  }
};
