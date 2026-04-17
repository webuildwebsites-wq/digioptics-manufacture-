import mongoose from "mongoose";

const powerSchema = new mongoose.Schema({
  side: { type: String, enum: ["R", "L"] },
  sph: Number,
  cyl: Number,
  axis: Number,
  add: Number,
  diameter: Number,
}, { _id: false });

const prismSchema = new mongoose.Schema({
  side: { type: String, enum: ["R", "L"] },
  prism: Number,
  base: String,
}, { _id: false });

const centrationSchema = new mongoose.Schema({
  side: { type: String, enum: ["R", "L"] },
  pd: Number,
  corridor: Number,
  fittingHeight: Number,
}, { _id: false });

const fittingSchema = new mongoose.Schema({
  hasFlatFitting: Boolean,
  dbl: Number,
  frameType: String,
  frameLength: Number,
  frameHeight: Number,
}, { _id: false });

const lensDataSchema = new mongoose.Schema({
  pantoscopeAngle: Number,
  bowAngle: Number,
  bvd: Number,
}, { _id: false });


const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, sparse: true },

  customer: {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerName: { type: String },
    customerShipToId: { type: mongoose.Schema.Types.ObjectId },
    customerShipToBranchName: { type: String },
  },

  orderReference: String,
  consumerCardName: String,
  opticianName: String,

  powerType: { type: String, enum: ["Single", "Both"] },
  productMode: { type: String, enum: ["Stock Lens", "Rx"] },
  hasPrism: Boolean,

  powers: [powerSchema],
  prisms: [prismSchema],

  brand: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductBrand" },
    name: String,
  },
  category: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory" },
    name: String,
  },
  index: Number,
  productName: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
  },
  coating: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCoating" },
    name: String,
  },
  treatment: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductTreatment" },
    name: String,
  },
  tint: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Tint" },
    name: String,
  },
  tintDetails: String,
  remarks: String,
  mirror: Boolean,

  centration: [centrationSchema],
  fitting: fittingSchema,
  lensData: lensDataSchema,
  directCustomer: String,
  price: { type: Number, default: 0 },
  shippingCharges: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  totalOrderPrice: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["Draft", "Submitted", "Processing", "Completed", "Cancelled"],
    default: "Submitted",
  },

  cancelReason: String,
  submittedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employee" },
}, { timestamps: true });

orderSchema.index({ "customer.customerId": 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export default mongoose.model("Order", orderSchema);
