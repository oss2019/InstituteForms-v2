import User from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { email, password, rollNumber } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password and create a new user
    const hashPassword = await bcryptjs.hash(password, 8);
    const newUser = new User({
      email,
      password: hashPassword,
      name: "",
      rollNumber,
      leaveApplication: "",
      outingRequest: "",
      roomNumber:"",
      branch:"",
      year: "",
      course: ""
    });

    await newUser.save();
    const token = jwt.sign(
      { userID: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Set your preferred token expiry time
    );
    res.status(201).json({
      message: "User created successfully",
      token,
      user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
    
  } catch (error) {
    console.log("error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

//login function

export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
  
      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      // Create a JWT token
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h', 
      });
  
      res.status(200).json({
        message: "Login successful",
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error) {
      console.log("error:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  export const getUserDetails = async (req, res) => {
    try {
      const { userId, rollNumber } = req.body; // Destructure both userId and rollNumber from request body
  
      let user;
  
      // If userId is provided, find by userId; otherwise, find by rollNumber
      if (userId) {
        user = await User.findById(userId, "name rollNumber email phnumber hostel roomNumber course branch year");
      } else if (rollNumber) {
        user = await User.findOne({ rollNumber }, "name rollNumber email"); // Find by rollNumber
      }
  
      // Check if user was found
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  

  export const editUserDetails = async (req, res) => {
    try {
      const { userId, ...updates } = req.body; // Destructure userId and the rest as updates
  
      // Ensure only permitted fields can be updated
      const allowedFields = ["name", "roomNumber", "branch", "year", "course", "hostel", "phnumber"];
  
      // Retrieve the existing user data
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Update the user's fields with only the allowed updates
      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          user[field] = updates[field]; // Modify the document directly
        }
      });
  
      // Save the updated user document
      const updatedUser = await user.save();
  
      res.status(200).json({
        message: "User details updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user details:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  
  