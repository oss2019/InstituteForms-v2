import EventApproval from "../models/event.model.js";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Utility function to determine semester and academic year based on date
const getSemesterInfo = (date) => {
  const eventDate = new Date(date);
  const month = eventDate.getMonth(); // 0-11
  const year = eventDate.getFullYear();
  
  let semester, academicYear;
  
  // Assuming academic year starts in August and ends in July next year
  // Fall semester: August - December
  // Spring semester: January - July
  
  if (month >= 7) { // August (7) to December (11)
    semester = "Autumn";
    academicYear = `${year}-${year + 1}`;
  } else { // January (0) to July (6)
    semester = "Spring";
    academicYear = `${year - 1}-${year}`;
  }
  
  return {
    semester: `${semester} ${academicYear.split('-')[semester === 'Autumn' ? 0 : 1]}`,
    academicYear
  };
};

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


const sendEmail = async (to, subject, text, retries = 3) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };

  console.log('Attempting to send email to:', to, 'with', retries, 'retries remaining');

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
  { role: "general-secretary-technical", email: "gstech@iitdh.ac.in" },
  { role: "general-secretary-cultural", email: "gscult@iitdh.ac.in" },
  { role: "general-secretary-sports", email: "gssports@iitdh.ac.in" },
  { role: "treasurer", email: "gstreas@iitdh.ac.in" },
  { role: "president", email: "vpsc@iitdh.ac.in" },
  { role: "ARSW", email: "arsw@iitdh.ac.in" },
  { role: "associate-dean", email: "adean.sw.gymkhana@iitdh.ac.in" },
  { role: "dean", email: "dean.sw@iitdh.ac.in" },
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
      clubName,
      startDate,
      endDate,
      eventVenue,
      budgetBreakup,
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

    // Set eventType based on user's type if club-secretary, else fallback to req.body.eventType
    let eventType = req.body.eventType || null;
    if (user.role === "club-secretary") {
      eventType = user.type;
    }

    const category = eventType;
    const categoryEmail = getEmailForCategory(category);

    // Check for any existing event approval in progress for this user
    const existingEvent = await EventApproval.findOne({
      userID_,
      "approvals.status": { $in: ["Pending"] },
    });

    if (existingEvent) {
      return res.status(400).json({ message: "You already have a pending event approval request." });
    }

    // Determine semester and academic year based on start date
    const semesterInfo = getSemesterInfo(startDate);

    // Create the initial approvals array
    const approvals = [
      { role: "club-secretary", status: "Approved", comment: "" },
      { role: "general-secretary", status: "Pending", comment: "" },
      { role: "treasurer", status: "Pending", comment: "" },
      { role: "president", status: "Pending", comment: "" },
      { role: "ARSW", status: "Pending", comment: "" },
      { role: "associate-dean", status: "Pending", comment: "" },
      { role: "dean", status: "Pending", comment: "" },
    ];

    // Create a new event approval request
    const newEventApproval = new EventApproval({
      userID,
      eventName,
      partOfGymkhanaCalendar,
      eventType, // Use the determined eventType
      clubName,
      startDate,
      endDate,
      semester: semesterInfo.semester,
      academicYear: semesterInfo.academicYear,
      eventVenue,
      budgetBreakup,
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
      try {
        await sendEmail(
          categoryEmail,
          `Event Approval Needed: ${eventName}`,
          `A new ${category} event approval request has been submitted. Please review it at your earliest convenience.`
        );
        console.log(`Email sent successfully to ${categoryEmail} for ${category} event approval.`);
      } catch (emailError) {
        console.error(`Failed to send email to ${categoryEmail}:`, emailError.message);
        // Don't fail the entire request due to email issues
      }
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
      return res.status(400).json({ message: "Validation error.", errors: error.errors });
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

const roleHierarchy = ["club-secretary", "general-secretary", "treasurer", "president", "ARSW", "associate-dean", "dean"];

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

    // Filter out those with a status of 'Pending' or 'Query'
    pendingApprovals = pendingApprovals.filter((approval) => {
      const approvalStatus = approval.approvals.find(
        (app) => app.role === role
      );
      return approvalStatus && (approvalStatus.status === "Pending" || approvalStatus.status === "Query");
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

    // Fetch only events with matching role and approved status (exclude closed events)
    let approvedApplications = await EventApproval.find({
      "approvals": {
        $elemMatch: {
          role: role,
          status: "Approved"
        }
      },
      status: { $ne: "Closed" }
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

    // Fetch only events with matching role and rejected status (exclude closed events)
    let rejectedApplications = await EventApproval.find({
      "approvals": {
        $elemMatch: {
          role: role,
          status: "Rejected"
        }
      },
      status: { $ne: "Closed" }
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

// Get Closed Event Applications
export const getClosedApplications = async (req, res) => {
  const { role, category } = req.body;

  console.log("Received role:", role);
  console.log("Received category:", category);

  try {
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    // Only allow specific roles to view closed events
    if (!["associate-dean", "dean", "ARSW"].includes(role)) {
      return res.status(403).json({ message: "Only associate-dean, dean, and ARSW can view closed events." });
    }

    // Fetch only events with status "Closed"
    let closedApplications = await EventApproval.find({
      status: "Closed"
    });

    console.log("Initial closed applications:", closedApplications);

    if (closedApplications.length === 0) {
      return res.status(200).json([]);
    }

    // Filter by category if role is 'general-secretary' (though this won't apply for these roles)
    if (role === "general-secretary" && category) {
      closedApplications = closedApplications.filter(
        (approval) => approval.eventType === category
      );
    }

    console.log("Final closed applications:", closedApplications);
    res.status(200).json(closedApplications);
  } catch (error) {
    console.error("Error fetching closed applications:", error);
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
  const { applicationId, role, status, comment } = req.body;

  try {
    console.log("Received request:", { applicationId, role, status, comment }); // Debug log

    if (!role || !['Approved', 'Rejected', 'Query'].includes(status)) {
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
    eventApproval.approvals[approvalIndex].comment = comment || "";
    
    if(status === "Rejected"){
      try {
        await sendEmail(
          eventApproval.email,
          `Event Rejected: ${eventApproval.eventName}`,
          `Your event "${eventApproval.eventName}" has been rejected by ${role}. Reason: ${comment || "No reason provided."}`
        );
        console.log(`Rejection email sent to organizer: ${eventApproval.email}`);
      } catch (emailError) {
        console.error(`Failed to send rejection email to organizer:`, emailError.message);
      }
    }
    else if(status === "Approved"){
    const nextRoleIndex = roleHierarchy.indexOf(role) + 1;
    if (nextRoleIndex < roleHierarchy.length) {
      const nextRole = roleHierarchy[nextRoleIndex];
      const nextRoleEmail = getEmailForRole(nextRole);
      
      if (nextRoleEmail) {
        try {
          await sendEmail(
            nextRoleEmail,
            `Event Approval Needed: ${eventApproval.eventName}`,
            `The event "${eventApproval.eventName}" has been approved by ${role}. It is now pending your review and approval.`
          );
          console.log(`Notification email sent to ${nextRole} at ${nextRoleEmail}`);
        } catch (emailError) {
          console.error(`Failed to send notification email to ${nextRole}:`, emailError.message);
        }
      } else {
        console.error(`No email found for next role: ${nextRole}`);
      }
    } else if (nextRoleIndex === roleHierarchy.length) {
      try {
        await sendEmail(
          eventApproval.email,
          `Event Fully Approved: ${eventApproval.eventName}`,
          `Congratulations! Your event "${eventApproval.eventName}" has been fully approved by all authorities.
          Event Details:
        - Event Name: ${eventApproval.eventName}
        - Event Type: ${eventApproval.eventType}
        - Date: ${new Date(eventApproval.startDate).toLocaleDateString()} to ${new Date(eventApproval.endDate).toLocaleDateString()}
        - Venue: ${eventApproval.eventVenue}
        - Organizer: ${eventApproval.nameOfTheOrganizer}

        Your event is now ready to proceed. Please ensure all arrangements are made as per the approved proposal.

        Best regards,
        Event Approval Committee`
        );
        console.log(`Final approval notification sent to organizer: ${eventApproval.email}`);
      } catch (emailError) {
        console.error(`Failed to send final approval email to organizer:`, emailError.message);
      }
    }
}
    await eventApproval.save();

    console.log("Application updated successfully:", { applicationId, status }); // Debug log
    res.status(200).json({ message: `Application ${status} successfully.` });
  } catch (error) {
    console.error("Error updating application status:", error); // Log full error
    res.status(500).json({ message: "Internal server error." });
  }
};

// Raise a query for an event application
export const raiseQuery = async (req, res) => {
  const { applicationId, role, queryText } = req.body;

  try {
    if (!applicationId || !role || !queryText) {
      return res.status(400).json({ message: "Application ID, role, and query text are required." });
    }

    const eventApproval = await EventApproval.findById(applicationId);
    if (!eventApproval) {
      return res.status(404).json({ message: "Event approval not found." });
    }

    // Check if the role can raise queries (not club-secretary)
    if (role === "club-secretary") {
      return res.status(403).json({ message: "Club secretary cannot raise queries." });
    }

    // Check if there's a pending approval for this role
    const approvalIndex = eventApproval.approvals.findIndex(
      (app) => app.role === role && app.status === "Pending"
    );

    if (approvalIndex === -1) {
      return res.status(400).json({ message: "No pending approval found for this role." });
    }

    // Update the approval status to "Query"
    eventApproval.approvals[approvalIndex].status = "Query";
    eventApproval.approvals[approvalIndex].comment = `Query raised: ${queryText}`;

    // Add the query to the queries array
    const newQuery = {
      askerRole: role,
      queryText,
      responderEmail: eventApproval.email,
      status: "Pending",
      raisedAt: new Date(),
    };

    eventApproval.queries.push(newQuery);
    await eventApproval.save();

    // Send email notification to the organizer
    try {
      await sendEmail(
        eventApproval.email,
        `Query Raised for Event: ${eventApproval.eventName}`,
        `A query has been raised for your event "${eventApproval.eventName}" by ${role}.

Query: ${queryText}

Please log into the application to respond to this query.

Event Details:
- Event Name: ${eventApproval.eventName}
- Event Type: ${eventApproval.eventType}
- Date: ${new Date(eventApproval.startDate).toLocaleDateString()} to ${new Date(eventApproval.endDate).toLocaleDateString()}

Please respond at your earliest convenience.

Best regards,
Event Approval Committee`
      );
      console.log(`Query notification email sent to organizer: ${eventApproval.email}`);
    } catch (emailError) {
      console.error(`Failed to send query notification email to organizer:`, emailError.message);
    }

    res.status(200).json({ message: "Query raised successfully.", query: newQuery });
  } catch (error) {
    console.error("Error raising query:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get all queries for an event
export const getEventQueries = async (req, res) => {
  const { eventId } = req.params;

  try {
    const eventApproval = await EventApproval.findById(eventId, 'queries');
    if (!eventApproval) {
      return res.status(404).json({ message: "Event not found." });
    }

    res.status(200).json({ queries: eventApproval.queries });
  } catch (error) {
    console.error("Error fetching queries:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Reply to a query (only for club-secretary or organizer)
export const replyToQuery = async (req, res) => {
  const { eventId, queryId, response, userRole, userEmail } = req.body;

  try {
    if (!eventId || !queryId || !response) {
      return res.status(400).json({ message: "Event ID, query ID, and response are required." });
    }

    const eventApproval = await EventApproval.findById(eventId);
    if (!eventApproval) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Find the query
    const queryIndex = eventApproval.queries.findIndex(
      (query) => query.queryId.toString() === queryId && query.status === "Pending"
    );

    if (queryIndex === -1) {
      return res.status(404).json({ message: "Query not found or already answered." });
    }

    const query = eventApproval.queries[queryIndex];

    // Check if the user is authorized to reply (only club-secretary)
    if (userRole !== "club-secretary") {
      return res.status(403).json({ message: "Only club-secretary can reply to queries." });
    }

    // Update the query with response
    eventApproval.queries[queryIndex].response = response;
    eventApproval.queries[queryIndex].status = "Answered";
    eventApproval.queries[queryIndex].answeredAt = new Date();

    // Reset the approval status back to Pending for the role that raised the query
    // BUT only if this is NOT a post-approval query
    // Post-approval queries should not change the approval status
    if (!query.isPostApprovalQuery) {
      const approvalIndex = eventApproval.approvals.findIndex(
        (approval) => approval.role === query.askerRole
      );

      if (approvalIndex !== -1) {
        eventApproval.approvals[approvalIndex].status = "Pending";
        eventApproval.approvals[approvalIndex].comment = "";
      }
    }

    await eventApproval.save();

    // Send email notification to the role that raised the query
    const roleEmail = getEmailForRole(query.askerRole);
    if (roleEmail) {
      try {
        await sendEmail(
          roleEmail,
          `Query Response Received: ${eventApproval.eventName}`,
          `Your query for event "${eventApproval.eventName}" has been responded to.

Original Query: ${query.queryText}
Response: ${response}

You can now review the event application again and take appropriate action.

Best regards,
Event Approval Committee`
        );
        console.log(`Query response notification sent to ${query.askerRole} at ${roleEmail}`);
      } catch (emailError) {
        console.error(`Failed to send query response notification to ${query.askerRole}:`, emailError.message);
      }
    } else {
      console.error(`No email found for role: ${query.askerRole}`);
    }

    res.status(200).json({ message: "Query response submitted successfully." });
  } catch (error) {
    console.error("Error replying to query:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get all unique semesters and academic years for filtering
export const getSemesterOptions = async (req, res) => {
  try {
    const { role, category } = req.query;

    let matchQuery = {};
    
    // Add role-based filtering if needed
    if (role && role !== 'club-secretary') {
      matchQuery[`approvals.role`] = role;
    }

    // Add category filtering for general-secretary
    if (role === 'general-secretary' && category) {
      matchQuery.eventType = category;
    }

    const semesterOptions = await EventApproval.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            semester: "$semester",
            academicYear: "$academicYear"
          }
        }
      },
      {
        $sort: { "_id.academicYear": -1, "_id.semester": 1 }
      }
    ]);

    const formattedOptions = semesterOptions.map(option => ({
      semester: option._id.semester,
      academicYear: option._id.academicYear,
      display: option._id.semester || `${option._id.academicYear} Academic Year`
    }));

    res.status(200).json(formattedOptions);
  } catch (error) {
    console.error("Error fetching semester options:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Enhanced function to get approved applications with semester filtering and search
export const getApprovedApplicationsWithFilters = async (req, res) => {
  const { role, category, semester, academicYear, search, page = 1, limit = 10 } = req.body;

  try {
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    // Base query for approved applications
    let query = {
      "approvals": {
        $elemMatch: {
          role: role,
          status: "Approved"
        }
      },
      // Exclude closed events
      status: { $ne: "Closed" }
    };

    // Add semester filtering
    if (semester) {
      query.semester = semester;
    }

    // Add academic year filtering
    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Add category filtering for general-secretary
    if (role === "general-secretary" && category) {
      query.eventType = category;
    }

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { eventName: searchRegex },
        { clubName: searchRegex },
        { nameOfTheOrganizer: searchRegex },
        { eventVenue: searchRegex },
        { eventDescription: searchRegex }
      ];
    }

    // Filter out past events
    const currentDate = new Date();
    query.endDate = { $gte: currentDate };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const approvedApplications = await EventApproval.find(query)
      .sort({ startDate: -1 }) // Sort by start date, newest first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await EventApproval.countDocuments(query);

    // Group by semester for better organization
    const groupedBySemester = approvedApplications.reduce((groups, app) => {
      const semesterKey = app.semester || `${app.academicYear} Academic Year`;
      if (!groups[semesterKey]) {
        groups[semesterKey] = [];
      }
      groups[semesterKey].push(app);
      return groups;
    }, {});

    res.status(200).json({
      applications: approvedApplications,
      groupedBySemester,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + approvedApplications.length < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching approved applications with filters:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Enhanced function to get pending applications with semester filtering and search
export const getPendingApprovalsWithFilters = async (req, res) => {
  const { role, category, semester, academicYear, search, page = 1, limit = 10 } = req.body;

  try {
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    const roleIndex = roleHierarchy.indexOf(role);
    if (roleIndex === -1) {
      return res.status(400).json({ message: "Invalid role." });
    }

    // Base query for pending applications
    let query = {
      "approvals.role": role,
    };

    // Add semester filtering
    if (semester) {
      query.semester = semester;
    }

    // Add academic year filtering
    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Add category filtering for general-secretary
    if (role === "general-secretary" && category) {
      query.eventType = category;
    }

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { eventName: searchRegex },
        { clubName: searchRegex },
        { nameOfTheOrganizer: searchRegex },
        { eventVenue: searchRegex },
        { eventDescription: searchRegex }
      ];
    }

    // Find all applications matching the base criteria
    let pendingApprovals = await EventApproval.find(query);

    if (pendingApprovals.length === 0) {
      return res.status(200).json({
        applications: [],
        groupedBySemester: {},
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    // Filter for pending or query status
    pendingApprovals = pendingApprovals.filter((approval) => {
      const approvalStatus = approval.approvals.find(
        (app) => app.role === role
      );
      return approvalStatus && (approvalStatus.status === "Pending" || approvalStatus.status === "Query");
    });

    // Ensure previous roles in the hierarchy are approved
    pendingApprovals = pendingApprovals.filter((approval) => {
      return roleHierarchy.slice(0, roleIndex).every((prevRole) => {
        const prevApproval = approval.approvals.find((app) => app.role === prevRole);
        return prevApproval && prevApproval.status === "Approved";
      });
    });

    // Apply pagination
    const totalCount = pendingApprovals.length;
    const skip = (page - 1) * limit;
    const paginatedApprovals = pendingApprovals
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(skip, skip + parseInt(limit));

    // Group by semester
    const groupedBySemester = paginatedApprovals.reduce((groups, app) => {
      const semesterKey = app.semester || `${app.academicYear} Academic Year`;
      if (!groups[semesterKey]) {
        groups[semesterKey] = [];
      }
      groups[semesterKey].push(app);
      return groups;
    }, {});

    res.status(200).json({
      applications: paginatedApprovals,
      groupedBySemester,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + paginatedApprovals.length < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching pending approvals with filters:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};



// Edit all event details (only allowed by club-secretary and only if approvals are still pending at general-secretary)
export const editEventDetails = async (req, res) => {
  const { eventId, userID, updates } = req.body;

  try {
    // Find the event
    const event = await EventApproval.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const user = await User.findById(userID);
    if (!user || user.role !== "club-secretary") {
      return res.status(403).json({ message: "Only club-secretary can edit event details." });
    }

    if (event.userID.toString() !== userID.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this event." });
    }
    

    // List of fields that can be updated
    const editableFields = [
      "eventName", "partOfGymkhanaCalendar", "eventType", "clubName", "startDate", "endDate",
      "eventVenue", "sourceOfBudget", "estimatedBudget", "nameOfTheOrganizer", "designation",
      "email", "phoneNumber", "requirements", "anyAdditionalAmenities", "eventDescription",
      "internalParticipants", "externalParticipants", "listofCollaboratingOrganizations", "budgetBreakup"
    ];

    // Track changes for version history BEFORE updating
    const changes = {};
    const dateFields = ['startDate', 'endDate'];
    
    editableFields.forEach(field => {
      if (updates[field] !== undefined) {
        const oldValue = event[field];
        const newValue = updates[field];
        
        let hasChanged = false;
        
        // Special handling for date fields - compare only the date part (before 'T')
        if (dateFields.includes(field)) {
          const oldDatePart = oldValue ? new Date(oldValue).toISOString().split('T')[0] : null;
          const newDatePart = newValue ? new Date(newValue).toISOString().split('T')[0] : null;
          hasChanged = oldDatePart !== newDatePart;
        } else {
          // For non-date fields, use deep comparison
          hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);
        }
        
        if (hasChanged) {
          changes[field] = {
            oldValue: oldValue,
            newValue: newValue
          };
        }
      }
    });

    // Now update the fields
    editableFields.forEach(field => {
      if (updates[field] !== undefined) {
        event[field] = updates[field];
      }
    });

    // If startDate changed, update semester/academicYear
    if (updates.startDate) {
      const semesterInfo = getSemesterInfo(updates.startDate);
      event.semester = semesterInfo.semester;
      event.academicYear = semesterInfo.academicYear;
    }

     // Update budgetBreakup if provided
    if (updates.budgetBreakup) {
      event.budgetBreakup = updates.budgetBreakup;  // Replace the existing budgetBreakup with the new one
    }

    // Add to edit history if there are changes
    if (Object.keys(changes).length > 0) {
      if (!event.editHistory) {
        event.editHistory = [];
      }
      event.editHistory.push({
        editedAt: new Date(),
        editedBy: userID,
        changes: changes,
        reason: "Event details updated by club-secretary"
      });
    }

    // Keep "Query" status as "Query", reset only non-approved and non-query to "Pending"
    event.approvals = event.approvals.map(a => {
      if (
        a.role !== "club-secretary" &&
        a.status !== "Query" &&
        a.status !== "Approved"
      ) {
        return { ...a, status: "Pending" };
      }
      return a; // Keep Query and Approved status unchanged
    });

    await event.save();

    res.status(200).json({ message: "Event details updated. Query and Approved statuses preserved.", event });
  } catch (error) {
    console.error("Error editing event details:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get edit history for an event
export const getEditHistory = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await EventApproval.findById(eventId).select('editHistory');
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Populate editor details and convert Map to plain object
    const historyWithUserDetails = await Promise.all(
      (event.editHistory || []).map(async (edit) => {
        const user = await User.findById(edit.editedBy).select('name email');
        const editObj = edit.toObject();
        
        // Convert Map to plain object for changes field
        const changesObj = {};
        if (editObj.changes instanceof Map) {
          editObj.changes.forEach((value, key) => {
            changesObj[key] = value;
          });
        } else if (editObj.changes) {
          // If it's already an object, use it directly
          Object.assign(changesObj, editObj.changes);
        }
        
        return {
          ...editObj,
          changes: changesObj,
          editorName: user?.name || 'Unknown User',
          editorEmail: user?.email || 'N/A'
        };
      })
    );

    res.status(200).json({ editHistory: historyWithUserDetails });
  } catch (error) {
    console.error("Error fetching edit history:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Edit budget breakup by ARSW/Associate Dean/Dean
export const editBudget = async (req, res) => {
  const { eventId, role, proposedBudgetBreakup, proposedEstimatedBudget } = req.body;

  try {
    // Find the event
    const event = await EventApproval.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if the user has permission to edit budget
    if (!["ARSW", "associate-dean", "dean"].includes(role)) {
      return res.status(403).json({ 
        message: "Only ARSW, Associate Dean, or Dean can edit the budget." 
      });
    }

    // Update proposed budget fields
    event.proposedBudgetBreakup = proposedBudgetBreakup;
    event.proposedEstimatedBudget = proposedEstimatedBudget;
    event.budgetEditedBy = role;
    event.budgetEditedAt = new Date();

    await event.save();

    res.status(200).json({ 
      message: "Budget proposal submitted successfully.", 
      event 
    });
  } catch (error) {
    console.error("Error editing budget:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const closeEvent = async (req, res) => {
  const { eventId, userID, closerName } = req.body;

  try {
    // Find the user and check role
    const user = await User.findById(userID);
    if (!user || !["ARSW", "associate-dean", "dean"].includes(user.role)) {
      return res.status(403).json({ message: "Only ARSW, associate-dean or dean can close events." });
    }

    // Find the event
    const event = await EventApproval.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if the event is fully approved
    const allApproved = event.approvals.every(
      (approval) => approval.status === "Approved"
    );

    if (!allApproved) {
      return res.status(400).json({ message: "Only fully approved events can be closed." });
    }

    // Check if event has ended
    const currentDate = new Date();
    const endDate = new Date(event.endDate);
    const hundredDaysBefore = new Date(endDate);
    hundredDaysBefore.setDate(endDate.getDate() - 100);
    console.log(hundredDaysBefore);
    if (currentDate < hundredDaysBefore) {
      return res.status(400).json({ 
        message: "Cannot close an event that hasn't ended yet. Event end date is " + endDate.toLocaleDateString() 
      });
    }

    // Set status to Closed and record who closed it
    event.status = "Closed";
    event.closedBy = closerName || user.name || "Unknown";
    event.closedAt = new Date();

    await event.save();

    // Send email notification to the organizer
    try {
      await sendEmail(
        event.email,
        `Event Closed: ${event.eventName}`,
        `Your event "${event.eventName}" has been officially closed.

Event Details:
- Event Name: ${event.eventName}
- Event Type: ${event.eventType}
- Date: ${new Date(event.startDate).toLocaleDateString()} to ${new Date(event.endDate).toLocaleDateString()}
- Venue: ${event.eventVenue}
- Closed By: ${event.closedBy}
- Closed On: ${event.closedAt.toLocaleDateString()}

Thank you for organizing this event. If you have any queries, please contact the Student Welfare Office.

Best regards,
Student Welfare Office`
      );
      console.log(`Event closure notification sent to organizer: ${event.email}`);
    } catch (emailError) {
      console.error(`Failed to send event closure notification to organizer:`, emailError.message);
    }

    res.status(200).json({ message: "Event closed successfully.", event });
  } catch (error) {
    console.error("Error closing event:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Raise a query for an approved event (for associate-dean, dean, ARSW)
export const raiseQueryForApprovedEvent = async (req, res) => {
  const { eventId, userID, queryText } = req.body;

  try {
    // Validate inputs
    if (!eventId || !userID || !queryText) {
      return res.status(400).json({ message: "Event ID, user ID, and query text are required." });
    }

    // Find the user and check role
    const user = await User.findById(userID);
    if (!user || !["ARSW", "associate-dean", "dean"].includes(user.role)) {
      return res.status(403).json({ message: "Only ARSW, associate-dean, or dean can raise queries for approved events." });
    }

    // Find the event
    const event = await EventApproval.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if the event is fully approved
    const allApproved = event.approvals.every(
      (approval) => approval.status === "Approved"
    );

    if (!allApproved) {
      return res.status(400).json({ message: "Can only raise queries for fully approved events." });
    }

    // Add the query to the queries array
    const newQuery = {
      askerRole: user.role,
      queryText,
      responderEmail: event.email,
      status: "Pending",
      raisedAt: new Date(),
      isPostApprovalQuery: true, // Flag to indicate this is a post-approval query
    };

    event.queries.push(newQuery);
    await event.save();

    // Send email notification to the organizer
    try {
      await sendEmail(
        event.email,
        `Post-Approval Query Raised for Event: ${event.eventName}`,
        `A query has been raised for your approved event "${event.eventName}" by ${user.role}.

Query: ${queryText}

Please log into the application to respond to this query.

Event Details:
- Event Name: ${event.eventName}
- Event Type: ${event.eventType}
- Date: ${new Date(event.startDate).toLocaleDateString()} to ${new Date(event.endDate).toLocaleDateString()}
- Venue: ${event.eventVenue}

Please respond at your earliest convenience.

Best regards,
Event Approval Committee`
      );
      console.log(`Post-approval query notification email sent to organizer: ${event.email}`);
    } catch (emailError) {
      console.error(`Failed to send post-approval query notification email to organizer:`, emailError.message);
    }

    res.status(200).json({ message: "Query raised successfully.", query: newQuery });
  } catch (error) {
    console.error("Error raising query for approved event:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};