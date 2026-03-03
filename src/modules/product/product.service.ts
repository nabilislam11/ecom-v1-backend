import { Product } from "./product.model.js";
import type { CreateProductDTO, UpdateProductDTO } from "./product.schema.js";

// PUBLIC: Only fetch active products (Limit naturally applied to 3, but safety capped)
export async function getPublicProducts() {
  return await Product.find({ isActive: true }).limit(3).sort({ createdAt: -1 });
}

// ADMIN: Fetch absolutely everything for the dashboard
export async function getAllProducts() {
  return await Product.find().sort({ createdAt: -1 });
}

export async function createProduct(data: CreateProductDTO) {
  // 1. Check for duplicate slug
  const existingProduct = await Product.findOne({ slug: data.slug });
  if (existingProduct) throw new Error("DUPLICATE_SLUG");

  // 2. Enforce the "Max 3 Active" Rule
  if (data.isActive) {
    const activeCount = await Product.countDocuments({ isActive: true });
    if (activeCount >= 3) throw new Error("MAX_ACTIVE_REACHED");
  }

  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  return await Product.create(cleanData);
}

export async function updateProduct(id: string, data: UpdateProductDTO) {
  // 1. NEW FIX: If they are trying to update the slug, ensure it doesn't belong to another product
  if (data.slug) {
    const existingSlug = await Product.findOne({ slug: data.slug, _id: { $ne: id } });
    if (existingSlug) throw new Error("DUPLICATE_SLUG");
  }

  // 2. Enforce the "Max 3 Active" Rule if they are trying to activate this product
  if (data.isActive === true) {
    const activeCount = await Product.countDocuments({ isActive: true, _id: { $ne: id } });
    if (activeCount >= 3) throw new Error("MAX_ACTIVE_REACHED");
  }

  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

  // 3. NEW FIX: Replace { new: true } with { returnDocument: "after" }
  const product = await Product.findByIdAndUpdate(id, cleanData, { returnDocument: "after" });
  if (!product) throw new Error("NOT_FOUND");

  return product;
}
