import type { Request, Response } from "express";
import * as OrderService from "./order.service.js";
import { createOrderSchema } from "./order.schema.js";
// 👇 FIX 1: Import the Payment Service
import * as PaymentService from "../payment/payment.service.js";

export async function createOrderHandler(req: Request, res: Response) {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });

    const userId = (req as any).user?.id;

    // 1. Create the pending order in MongoDB
    const order = await OrderService.createPendingOrder(parsed.data, userId);

    // 👇 FIX 2: Generate the Stripe Checkout Link using the new order
    const checkoutUrl = await PaymentService.createCheckoutSession(order);

    // 👇 FIX 3: Send the URL back to the frontend so it can redirect the user!
    return res.status(201).json({
      message: "Order initialized, redirecting to payment...",
      checkoutUrl: checkoutUrl, // The frontend will use this to open the payment page
      order,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Failed to create order" });
  }
}

export async function getAllOrdersHandler(req: Request, res: Response) {
  try {
    const orders = await OrderService.getAllOrders();
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error fetching orders" });
  }
}

export async function getOrderBySessionHandler(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const order = await OrderService.getOrderBySessionId(sessionId as string);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Return the full order data to the frontend so it can draw the receipt!
    return res.status(200).json(order);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch order details" });
  }
}
