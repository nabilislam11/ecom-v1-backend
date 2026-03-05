import { Order } from "./order.model.js";
import { Product } from "../product/product.model.js";
import type { CreateOrderDTO } from "./order.schema.js";

// Deeply strip 'undefined' values to satisfy strict TypeScript
const cleanData = (data: any) => JSON.parse(JSON.stringify(data));

export async function createPendingOrder(data: CreateOrderDTO, userId?: string) {
  let calculatedTotal = 0;
  const processedItems = [];

  for (const item of data.items) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    if (!product.isActive) throw new Error(`Product ${product.name} is currently inactive`);

    // The ? is now safe because we added _id to the IVariant interface
    const variant = product.variants.find((v) => v._id?.toString() === item.variantId);
    if (!variant) throw new Error(`Variant not found for product ${product.name}`);

    processedItems.push({
      productId: product._id,
      variantId: variant._id,
      name: product.name,
      sizeLabel: variant.sizeLabel,
      quantity: item.quantity,
      priceAtPurchase: variant.price,
    });

    calculatedTotal += variant.price * item.quantity;
  }

  // Build the raw data object
  const rawOrderData = {
    userId: userId || null,
    email: data.email,
    shippingAddress: data.shippingAddress,
    items: processedItems,
    totalAmount: calculatedTotal,
    paymentStatus: "pending",
  };

  // 👇 FIX: Use cleanData to strip out any 'undefined' values (like aptOrSuite)
  const newOrder = await Order.create(cleanData(rawOrderData));

  return newOrder;
}

export async function getAllOrders() {
  return await Order.find().sort({ createdAt: -1 });
}

export async function getOrderBySessionId(sessionId: string) {
  // We use findOne to search by the stripeSessionId field
  const order = await Order.findOne({ stripeSessionId: sessionId });
  return order;
}
