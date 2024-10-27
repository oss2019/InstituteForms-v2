import express from "express";
import { applyForLeave, getAllLeaveApplications, getLeaveStatus, updateLeaveExtension, updateLeaveStatus,scanLeaveApplication } from '../controller/leave.controller.js'



const router = express.Router();

router.post("/apply", applyForLeave);
router.post("/status",getLeaveStatus); 
router.put("/update/:applicationId", updateLeaveStatus);
router.put("/extension/:applicationId", updateLeaveExtension);
router.get("/all", getAllLeaveApplications);
router.patch('/scan/:applicationId', scanLeaveApplication);


export default router;
