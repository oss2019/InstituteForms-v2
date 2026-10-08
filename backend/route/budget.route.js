import express from "express";
import {
  getClubsFromUsers,
  getAcademicYears,
  createAcademicYear,
  getBudgetOverview,
  saveCouncilBudget,
  saveClubBudget,
  deleteClub,
  addBudgetTransaction,
  deleteBudgetTransaction,
  getBudgetTransactions,
} from "../controller/budgetController.js";

const router = express.Router();
router.get("/academic-years", getAcademicYears);
router.post("/academic-year", createAcademicYear);
router.get("/overview", getBudgetOverview);
router.post("/council", saveCouncilBudget);
router.post("/club", saveClubBudget);
router.delete("/club",deleteClub);
router.post("/transaction", addBudgetTransaction);
router.delete("/transaction", deleteBudgetTransaction);
router.get("/transactions", getBudgetTransactions);
router.get("/clubs",getClubsFromUsers);

export default router;