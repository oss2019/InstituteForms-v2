import express from "express";
import { editUserDetails, getUserDetails, googleLogin, studentGoogleLogin, signup, login  } from "../controller/user.controller.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/student-google-login", studentGoogleLogin);
router.post("/details", getUserDetails);
router.put("/edit", editUserDetails);
router.get("/google", googleLogin)
export default router;