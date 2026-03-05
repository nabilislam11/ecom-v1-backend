import Stripe from "stripe";
import { env } from "../../config/env.js";
import { Order } from "../order/order.model.js";
// import { emailQueue } from "../../config/queue.js";

// 1. Initialize Stripe (Bypassing the strict literal type check with 'as any')
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

// 2. Generate the Secure Checkout Page
export async function createCheckoutSession(order: any) {
  // Map our database items into the exact format Stripe requires
  const lineItems = order.items.map((item: any) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.name} - ${item.sizeLabel}`,
        },
        // Stripe expects amounts in CENTS (so $22.00 is 2200)
        unit_amount: Math.round(item.priceAtPurchase * 100),
      },
      quantity: item.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    // 👇 FIX: We removed 'payment_method_types'.
    // Now Stripe will automatically use whatever you enable in your Dashboard!
    mode: "payment",
    customer_email: order.email,
    line_items: lineItems,

    // We attach the DB Order ID here so when Stripe pings us later, we know EXACTLY which order was paid for
    client_reference_id: order._id.toString(),

    // Where Stripe sends them after they pay (Update these to your real frontend URLs later)
    success_url: `http://localhost:${env.PORT}/order/session/{CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:${env.PORT}/order/session/{CHECKOUT_SESSION_ID}`,

    // We strictly enforce US shipping
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
  });

  // Save the Stripe Session ID to our database order so we have a record of it
  order.stripeSessionId = session.id;
  await order.save();

  return session.url; // This is the magical link we send to the frontend!
}

// 3. The Webhook Handler (When Stripe says "Give them the goods!")
export async function handleStripeWebhook(signature: string, rawBody: Buffer) {
  let event: Stripe.Event;

  try {
    // This verifies that the ping ACTUALLY came from Stripe and not a hacker
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    throw new Error(`Webhook Verification Failed: ${err.message}`);
  }

  // If the payment was completely successful
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id;

    if (orderId) {
      // Find the order and mark it as PAID!
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = "paid";
        await order.save();

        console.log(`✅ Order ${orderId} has been successfully paid!`);

        // 🚨 LATER: This is exactly where we will tell ZeptoMail to send the Order Receipt!
        // await emailQueue.add("send-order-receipt", { ... });
      } else {
        console.error(`🚨 Webhook received for Order ${orderId}, but it doesn't exist in our DB!`);
      }
    }
  } else {
    // Just logs other events (like payment failed, etc) so you can see them in your terminal
    console.log(`ℹ️ Unhandled Stripe Event: ${event.type}`);
  }

  return { received: true };
}
