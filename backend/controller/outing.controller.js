import OutingRequest from "../models/outing.model.js";
import User from "../models/user.model.js";

// Apply for Outing
export const applyForOuting = async (req, res) => {
    try {
        const { placeOfVisit, reason, emergencyContact } = req.body;
        const userID = req.body.userID; // will be fetched from local storage on frontend

        // Check if the user already has an approved outing request
        const existingApplication = await OutingRequest.findOne({
            userID,
            status: 'Approved'
        });

        if (existingApplication) {
            return res.status(400).json({ message: "You already have an existing outing application." });
        }

        // If no existing approved application, create a new outing request
        const newApplication = new OutingRequest({
            userID,
            placeOfVisit,
            reason,
            outTime: new Date(), // Set outTime to the current date and time
            inTime: "", // You can also set a default value for inTime if needed
            emergencyContact
        });

        // Save the outing request ID to the user's document
        await User.findByIdAndUpdate(userID, { outingRequest: newApplication._id });

        await newApplication.save();
        res.status(201).json({
            message: "Outing application submitted successfully.",
            application: newApplication
        });
    } catch (error) {
        console.log("error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get Outing Status
export const getOutingStatus = async (req, res) => {
    try {
        const { userID } = req.body; // Ensure you're getting userID correctly

        // Use findOne to get only one outing request for the user
        const outingRequest = await OutingRequest.findOne({ userID })

        if (!outingRequest) {
            return res.status(404).json({ message: "No outing application found." });
        }

        // Return the single outing request
        res.status(200).json({
            outingRequest
        });
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};


export const getAllOutings = async (req, res) => {
    try {
        // Fetch all outing requests from the database
        const allOutings = await OutingRequest.find();

        if (allOutings.length === 0) {
            return res.status(404).json({ message: "No outing applications found." });
        }

        // Return the list of all outing requests
        res.status(200).json(allOutings);
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const scanOutingApplication = async (req, res) => {
    try {
        const { applicationId } = req.params; // Get applicationId from request parameters
        const outingApplication = await OutingRequest.findById(applicationId);

        if (!outingApplication) {
            return res.status(404).json({ message: "Outing application not found" });
        }

        // Update the scanned field with the current date and time
        outingApplication.scanned = new Date();
        await outingApplication.save();

        res.status(200).json({
            message: "Outing application scanned successfully.",
            application: outingApplication
        });
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteOutingRequest = async (req, res) => {
    try {
        const { applicationId } = req.params; // Get applicationId from request parameters
        const outingRequest = await OutingRequest.findByIdAndDelete(applicationId);

        if (!outingRequest) {
            return res.status(404).json({ message: "outing request not found" });
        }

        res.status(200).json({
            message: "outing request deleted successfully.",
        });
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};