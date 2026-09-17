import express from "express";
import {
  createDeal,
  getDeals,
  updateDeal,
  deleteDeal,
  getActiveDeals,
} from "../controllers/dealController.js";

const router = express.Router();

router.post("/", createDeal);

// ⚠️ active route always before :listingId
router.get("/active", getActiveDeals);

router.get("/:listingId", getDeals);

router.put("/:id", updateDeal);

router.delete("/:id", deleteDeal);


export default router;