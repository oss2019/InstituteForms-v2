import LeaveApplication from "../models/leave.model.js";
import User from "../models/user.model.js";

// Apply for Leave
export const applyForLeave = async (req, res) => {
    try {
        const { placeOfVisit, reason, dateOfLeaving, arrivalDate, emergencyContact } = req.body;
        const userID = req.body.userID; // Ensure you get this from local storage 

        // Fetch user details to check if required fields are filled
        const user = await User.findById(userID);

        // Check if required user details are filled
        if (!user.phnumber || !user.roomNumber || !user.year || !user.course || !user.hostel) {
            return res.status(400).json({ message: "Please complete your profile with phone number, room number, year, and course before applying for leave." });
        }

        // Check for pending leave applications for the user
        const existingApplication = await LeaveApplication.findOne({
            userID,
            status: 'Pending'
        });

        if (existingApplication) {
            return res.status(400).json({ message: "You already have a pending leave application." });
        }

        // If no pending leave application, proceed to create a new leave application
        const newApplication = new LeaveApplication({
            userID,
            placeOfVisit,
            reason,
            dateOfLeaving,
            arrivalDate,
            emergencyContact
        });

        await User.findByIdAndUpdate(userID, { leaveApplication: newApplication._id });

        await newApplication.save();
        res.status(201).json({
            message: "Leave application submitted successfully.",
            application: newApplication
        });
    } catch (error) {
        console.log("error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get Leave Status for a User
export const getLeaveStatus = async (req, res) => {
  try {
      const { userID } = req.body; // Ensure you're getting userID correctly

      // Use findOne to get only one leave application for the user
      const leaveApplication = await LeaveApplication.findOne({ userID });

      if (!leaveApplication) {
          return res.status(404).json({ message: "No leave applications found" });
      }

      res.status(200).json(leaveApplication); // Send the single leave application as a JSON response
  } catch (error) {
      console.log("Error:", error.message);
      res.status(500).json({ message: "Internal server error" });
  }
};


// Warden approval 
export const updateLeaveStatus = async (req, res) => {
    try {
        const { applicationId } = req.params; // Get applicationId from request parameters
        const { status } = req.body; // Get status from request body

        // Validate the status
        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be either 'Pending', 'Approved', or 'Rejected'." });
        }

        // Find the leave application and update the status
        const updatedApplication = await LeaveApplication.findByIdAndUpdate(
            applicationId,
            { status },
            { new: true } // Return the updated document
        );

        if (!updatedApplication) {
            return res.status(404).json({ message: "Leave application not found" });
        }

        res.status(200).json({
            message: "Leave application status updated successfully.",
            application: updatedApplication
        });
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Leave extension 
export const updateLeaveExtension = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { newArrivalDate } = req.body;

        const leaveApplication = await LeaveApplication.findById(applicationId);

        if (!leaveApplication) {
            return res.status(404).json({ message: "Leave application not found" });
        }

        // Update the arrival date and mark the status as 'Extension'
        leaveApplication.arrivalDate = newArrivalDate;
        leaveApplication.status = 'Extension';

        await leaveApplication.save();

        res.status(200).json({
            message: "Leave extension requested successfully.",
            application: leaveApplication
        });
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// All leave applications for warden
export const getAllLeaveApplications = async (req, res) => {
    try {
        const applications = await LeaveApplication.find().populate("userID", "name rollNumber email");
        res.status(200).json(applications);
    } catch (error) {
        console.error("Error fetching leave applications:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Scan leave application
export const scanLeaveApplication = async (req, res) => {
    try {
        const { applicationId } = req.params; // Get applicationId from request parameters
        const leaveApplication = await LeaveApplication.findById(applicationId);

        if (!leaveApplication) {
            return res.status(404).json({ message: "Leave application not found" });
        }

        // Update the scanned field with the current date and time
        leaveApplication.scanned = new Date();
        await leaveApplication.save();

        res.status(200).json({
            message: "Leave application scanned successfully.",
            application: leaveApplication
        });
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
