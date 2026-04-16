import express from "express";
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, addInventory, getInventoryByProductId, getProductsByCategory, filterProducts, suggestionProduct, getInventoryByProductCode } from "../../core/controllers/Product/Product.controller.js";
import { digiupload } from "../uploads/multer.js";


const router = express.Router();


// Get all products (pagination)
router.get("/", getProducts);
// Get single product
router.get("/:id", getProductById);
// Suggestions
router.get("/suggestion", suggestionProduct);
// Inventory by product ID
router.get("/inventory/:productId", getInventoryByProductId);
// Inventory by product code
router.get("/inventory/productCode/:productCode", getInventoryByProductCode);
// Get by category
router.get("/category/:category", getProductsByCategory);

// Create product
router.post("/", digiupload.any(), createProduct);
// Add inventory
router.post("/add/inventory", addInventory);
// Filter products
router.post("/search", filterProducts);


// Update product
router.put("/", digiupload.single("image"), updateProduct);


// Delete product
router.delete("/:id", deleteProduct);
export default router;
