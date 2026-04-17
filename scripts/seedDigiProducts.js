import mongoose from "mongoose";
import dotenv from "dotenv";
import DigiProduct from "../src/models/Product/Product.model.js";

dotenv.config();

const products = [
  {
    productCode: "LMV-KLARX-001",
    productName: "LUMOVEX KLARX LITE 1.50",
    brand: "LUMOVEX",
    category: "KLARX",
    coating: "NOVASHIELD",
    index: "1.50",
    price: 499,
    mrp: 799,
    gst: 12,
    hsnSac: "90013000",
    qty: 120,
  },
  {
    productCode: "LMV-KLARX-002",
    productName: "LUMOVEX KLARX ULTRA 1.56",
    brand: "LUMOVEX",
    category: "KLARX",
    coating: "NOVASHIELD PLUS",
    index: "1.56",
    price: 699,
    mrp: 1099,
    gst: 12,
    hsnSac: "90013000",
    qty: 90,
  },
  {
    productCode: "LMV-KLARX-003",
    productName: "LUMOVEX KLARX PRO 1.60",
    brand: "LUMOVEX",
    category: "KLARX",
    coating: "NOVASHIELD HD",
    index: "1.60",
    price: 950,
    mrp: 1450,
    gst: 12,
    hsnSac: "90013000",
    qty: 60,
  },
  {
    productCode: "LMV-DRIFTEX-001",
    productName: "LUMOVEX DRIFTEX STANDARD 1.56",
    brand: "LUMOVEX",
    category: "DRIFTEX",
    coating: "NOVASHIELD",
    index: "1.56",
    price: 1200,
    mrp: 1900,
    gst: 12,
    hsnSac: "90013000",
    qty: 45,
  },
  {
    productCode: "LMV-DRIFTEX-002",
    productName: "LUMOVEX DRIFTEX ELITE 1.67",
    brand: "LUMOVEX",
    category: "DRIFTEX",
    coating: "NOVASHIELD HD",
    index: "1.67",
    price: 1800,
    mrp: 2800,
    gst: 12,
    hsnSac: "90013000",
    qty: 30,
  },

  // ── Brand: OPTRAZE ──────────────────────────────────────────────────────────
  {
    productCode: "OPR-VEXON-001",
    productName: "OPTRAZE VEXON CLEAR 1.50",
    brand: "OPTRAZE",
    category: "VEXON",
    coating: "CRYSTACOAT",
    index: "1.50",
    price: 380,
    mrp: 620,
    gst: 12,
    hsnSac: "90013000",
    qty: 200,
  },
  {
    productCode: "OPR-VEXON-002",
    productName: "OPTRAZE VEXON TINTED 1.56",
    brand: "OPTRAZE",
    category: "VEXON",
    coating: "CRYSTACOAT UV",
    index: "1.56",
    price: 520,
    mrp: 850,
    gst: 12,
    hsnSac: "90013000",
    qty: 160,
  },
  {
    productCode: "OPR-VEXON-003",
    productName: "OPTRAZE VEXON PREMIUM 1.60",
    brand: "OPTRAZE",
    category: "VEXON",
    coating: "CRYSTACOAT MAX",
    index: "1.60",
    price: 750,
    mrp: 1200,
    gst: 12,
    hsnSac: "90013000",
    qty: 100,
  },
  {
    productCode: "OPR-FLUXAR-001",
    productName: "OPTRAZE FLUXAR BASE 1.56",
    brand: "OPTRAZE",
    category: "FLUXAR",
    coating: "CRYSTACOAT",
    index: "1.56",
    price: 2200,
    mrp: 3400,
    gst: 12,
    hsnSac: "90013000",
    qty: 35,
  },
  {
    productCode: "OPR-FLUXAR-002",
    productName: "OPTRAZE FLUXAR ADVANCE 1.67",
    brand: "OPTRAZE",
    category: "FLUXAR",
    coating: "CRYSTACOAT MAX",
    index: "1.67",
    price: 3500,
    mrp: 5200,
    gst: 12,
    hsnSac: "90013000",
    qty: 20,
  },

  {
    productCode: "ZNL-PRISMEX-001",
    productName: "ZENOLUX PRISMEX LIGHT 1.50",
    brand: "ZENOLUX",
    category: "PRISMEX",
    coating: "AEROGUARD",
    index: "1.50",
    price: 610,
    mrp: 980,
    gst: 12,
    hsnSac: "90013000",
    qty: 110,
  },
  {
    productCode: "ZNL-PRISMEX-002",
    productName: "ZENOLUX PRISMEX SHARP 1.56",
    brand: "ZENOLUX",
    category: "PRISMEX",
    coating: "AEROGUARD PLUS",
    index: "1.56",
    price: 820,
    mrp: 1300,
    gst: 12,
    hsnSac: "90013000",
    qty: 80,
  },
  {
    productCode: "ZNL-PRISMEX-003",
    productName: "ZENOLUX PRISMEX ULTRA 1.60",
    brand: "ZENOLUX",
    category: "PRISMEX",
    coating: "AEROGUARD HD",
    index: "1.60",
    price: 1100,
    mrp: 1750,
    gst: 12,
    hsnSac: "90013000",
    qty: 55,
  },
  {
    productCode: "ZNL-ORBIVEX-001",
    productName: "ZENOLUX ORBIVEX STANDARD 1.60",
    brand: "ZENOLUX",
    category: "ORBIVEX",
    coating: "AEROGUARD",
    index: "1.60",
    price: 4800,
    mrp: 7200,
    gst: 12,
    hsnSac: "90013000",
    qty: 28,
  },
  {
    productCode: "ZNL-ORBIVEX-002",
    productName: "ZENOLUX ORBIVEX ELITE 1.67",
    brand: "ZENOLUX",
    category: "ORBIVEX",
    coating: "AEROGUARD HD",
    index: "1.67",
    price: 6500,
    mrp: 9800,
    gst: 12,
    hsnSac: "90013000",
    qty: 15,
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB\n");

  const deleted = await DigiProduct.deleteMany({});
  console.log(`🗑️  Deleted ${deleted.deletedCount} existing DigiProduct(s)\n`);

  const inserted = await DigiProduct.insertMany(products);
  console.log(`✅ Inserted ${inserted.length} test DigiProduct(s)\n`);

  const brands     = [...new Set(inserted.map((p) => p.brand))];
  const categories = [...new Set(inserted.map((p) => p.category))];
  const coatings   = [...new Set(inserted.map((p) => p.coating))];

  console.log("── Brands ──────────────────────────────────────────────");
  brands.forEach((b) => console.log("  •", b));

  console.log("\n── Categories ──────────────────────────────────────────");
  categories.forEach((c) => console.log("  •", c));

  console.log("\n── Coatings ────────────────────────────────────────────");
  coatings.forEach((c) => console.log("  •", c));

  console.log("\n── Products by Brand + Category ────────────────────────");
  for (const brand of brands) {
    for (const cat of categories) {
      const count = inserted.filter((p) => p.brand === brand && p.category === cat).length;
      if (count > 0) console.log(`  ${brand} / ${cat} → ${count} product(s)`);
    }
  }

  console.log("\n✅ Done. Test these APIs:");
  console.log("   GET /api/order/product-fields/brand");
  console.log("   GET /api/order/product-fields/category?brand=LUMOVEX");
  console.log("   GET /api/order/product-fields/coating?brand=LUMOVEX&category=KLARX");
  console.log("   GET /api/order/product-names?brand=LUMOVEX&category=KLARX");
  console.log("   GET /api/order/product-names?brand=OPTRAZE&category=FLUXAR");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
