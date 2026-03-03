import { Router } from "express";
import {
  getPublicProductsHandler,
  getAllProductsHandler,
  createProductHandler,
  updateProductHandler,
} from "./product.controller.js";

import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";

const router = Router();

// ==========================================
// Public Routes (Users)
// ==========================================
// Returns only the strictly 3 active products
router.get("/", getPublicProductsHandler);

// ==========================================
// Admin Routes (Dashboard)
// ==========================================
router.get("/all", requireAuth, requireRole("admin"), getAllProductsHandler);
router.post("/", requireAuth, requireRole("admin"), createProductHandler);
router.put("/:id", requireAuth, requireRole("admin"), updateProductHandler);

export default router;
