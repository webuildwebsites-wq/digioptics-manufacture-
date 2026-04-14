import express from "express";
const router = express.Router();

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addInventory,
  getInventoryByProductId,
  getProductsByCategory,
  filterProducts,
  suggestionProduct,
  getInventoryByProductCode,
  // bulkUploadProducts
} from "../../core/controllers/Product/Product.controller.js";

import {digiupload} from "../uploads/multer.js";


// Create product
router.post("/", digiupload.any(), createProduct);

// Bulk Create product
// router.post("/bulk", upload.any(), bulkUploadProducts);
// router.post("/bulk", bulkUploadProducts);

// Suggestions
router.get("/suggestion", suggestionProduct);

// Get all products (pagination)
router.get("/", getProducts);

// Get by category
router.get("/category/:category", getProductsByCategory);

// Get single product
router.get("/:id", getProductById);

// Update product
router.put("/", digiupload.single("image"), updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

// Add inventory
router.post("/add/inventory", addInventory);

// Inventory by product ID
router.get("/inventory/:productId", getInventoryByProductId);

// Inventory by product code
router.get("/inventory/productCode/:productCode", getInventoryByProductCode);

// Filter products
router.post("/search", filterProducts);


export default router;