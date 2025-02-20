import express from "express";
import { editUserDetails, getUserDetails, googleLogin, login, signup  } from "../controller/user.controller.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/google-login", googleLogin);
router.post("/details", getUserDetails);
router.put("/edit", editUserDetails);
router.get("/google", googleLogin)
export default router;