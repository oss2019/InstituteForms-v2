import express from "express";
import { editUserDetails, getUserDetails, login, signup } from "../controller/user.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/details", getUserDetails);
router.put("/edit", editUserDetails);

export default router;