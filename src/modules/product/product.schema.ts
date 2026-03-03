import { z } from "zod";

const stockStatusEnum = z.enum(["IN_STOCK", "OUT_OF_STOCK", "LOW_STOCK", "UPCOMING"], {
  error: "Status must be IN_STOCK, OUT_OF_STOCK, LOW_STOCK, or UPCOMING",
});
export const createProductSchema = z.object({
  name: z.string().min(2, { error: "Product name is required" }),
  slug: z.string().min(2, { error: "Slug is required" }),
  badge: z.string().optional(),
  description: z.string().min(10, { error: "Description must be at least 10 characters" }),
  features: z.array(z.string()).default([]),
  price: z.number().positive({ error: "Price must be greater than zero" }),
  imageUrl: z.url({ error: "Must be a valid image URL" }),
  stock: z.int().nonnegative().default(0),
  stockStatus: stockStatusEnum.default("UPCOMING"),
  isActive: z.boolean().default(false), // Defaults to false to prevent accidental active limits!
});

export const updateProductSchema = createProductSchema.partial();

export const productIdParamSchema = z.object({
  id: z.string({ error: "Product ID must be a valid string" }),
});

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;
