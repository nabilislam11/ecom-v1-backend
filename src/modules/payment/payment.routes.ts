import { Router } from "express";
import express from "express";
import { stripeWebhookHandler } from "./payment.controller.js";

const router = Router();

router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

export default router;
