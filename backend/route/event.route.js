import express from "express";
import { getAllLeaveApplications, getLeaveStatus, updateLeaveExtension, updateLeaveStatus,scanLeaveApplication, deleteLeaveApplication, applyForEventApproval } from '../controller/event.controller.js'



const router = express.Router();

router.post("/apply", applyForEventApproval);
router.post("/status",getLeaveStatus); 
router.put("/update/:applicationId", updateLeaveStatus);
router.put("/extension/:applicationId", updateLeaveExtension);
router.get("/all", getAllLeaveApplications);
router.patch('/scan/:applicationId', scanLeaveApplication);
router.delete('/delete/:id', deleteLeaveApplication);


export default router;
