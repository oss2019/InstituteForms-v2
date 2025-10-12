import User from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import jwt from "jsonwebtoken";
import { oauth2Client } from "../googleClient.js";
import axios from "axios";

// export const signup = async (req, res) => {
//   try {
//     const { email, password, category } = req.body;

//     // Check if the user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Hash the password and create a new user
//     const hashPassword = await bcryptjs.hash(password, 8);
//     const newUser = new User({
//       email,
//       password: hashPassword,
//       name: "",
//       category,
//       eventApproval: "",
//       phnumber: "",
//     });

//     await newUser.save();
//     const token = jwt.sign(
//       { userID: newUser._id, role: newUser.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" } // Set your preferred token expiry time
//     );
//     res.status(201).json({
//       message: "User created successfully",
//       token,
//       user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, category: newUser.category },
//     });
    
//   } catch (error) {
//     console.log("error:", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// //login function

// export const login = async (req, res) => {
//     try {
//       const { email, password } = req.body;
  
//       const user = await User.findOne({ email });
//       if (!user) {
//         return res.status(400).json({ message: "User not found" });
//       }
  
//       const isMatch = await bcryptjs.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: "Invalid credentials" });
//       }
  
//       // Create a JWT token
//       const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//         expiresIn: '1h', 
//       });
  
//       res.status(200).json({
//         message: "Login successful",
//         token,
//         user: { _id: user._id, name: user.name, email: user.email, role: user.role },
//       });
//     } catch (error) {
//       console.log("error:", error.message);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   };

//Google login function

export const googleLogin = async (req, res) => {
  const { token } = req.body; // JWT sent from the frontend

  try {
    // Verify the JWT
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Replace with your client ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Find or create a user in the database
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a JWT token for your application
    const appToken = jwt.sign(
      { userID: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "success",
      token: appToken,
      user,
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Google Login failed" });
  }
};

  export const getUserDetails = async (req, res) => {
    try {
      const { userId, email } = req.body; // Destructure both userId and rollNumber from request body
  
      let user;
  
      // If userId is provided, find by userId; otherwise, find by rollNumber
      if (userId) {
        user = await User.findById(userId, "eventApproval name email phnumber category");
      } else if (email) {
        user = await User.findOne({ email }, "name eventApproval phnumber category"); 
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
      const allowedFields = ["name", "category", "phnumber"];
  
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
  
  
  