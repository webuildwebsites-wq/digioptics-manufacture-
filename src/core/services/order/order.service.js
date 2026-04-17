import Order from "../../../models/order/customer.order.js";
import Customer from "../../../models/Auth/Customer.js";
import Tint from "../../../models/order/Tint.js";
import FrameType from "../../../models/order/FrameType.js";
import ProductTreatment from "../../../models/order/ProductTreatment.js";
import ProductType from "../../../models/order/ProductType.js";
import DigiProduct from "../../../models/Product/Product.model.js";


export async function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = "ORD-" + dateStr + "-";

  const last = await Order.findOne(
    { orderNumber: { $regex: "^" + prefix } },
    { orderNumber: 1 },
    { sort: { orderNumber: -1 } }
  ).lean();

  const seq = last?.orderNumber
    ? parseInt(last.orderNumber.split("-").pop(), 10) + 1
    : 1;

  return prefix + String(seq).padStart(4, "0");
}


async function resolveDiigProductField(fieldKey, value, fieldLabel) {
  if (!value) return null;

  if (typeof value === "object" && value.id) {
    const doc = await DigiProduct.findById(value.id).lean();
    if (!doc) throw { statusCode: 404, code: "NOT_FOUND", message: `${fieldLabel} with id "${value.id}" not found in products` };
    return { id: doc._id, name: doc[fieldKey] };
  }

  if (typeof value === "string") {
    const doc = await DigiProduct.findOne({
      [fieldKey]: { $regex: `^${value.trim()}$`, $options: "i" },
    }).lean();
    if (!doc) throw { statusCode: 404, code: "NOT_FOUND", message: `${fieldLabel} "${value}" not found in products` };
    return { id: doc._id, name: doc[fieldKey] };
  }

  return null;
}

async function resolveDropdownField(Model, value, fieldLabel, nameField = "name") {
  if (!value) return null;

  if (typeof value === "object" && value.id) {
    const doc = await Model.findById(value.id).lean();
    if (!doc) throw { statusCode: 404, code: "NOT_FOUND", message: `${fieldLabel} with id "${value.id}" not found` };
    return { id: doc._id, name: doc[nameField] };
  }

  if (typeof value === "string") {
    const doc = await Model.findOne({
      [nameField]: { $regex: `^${value.trim()}$`, $options: "i" },
    }).lean();
    if (!doc) throw { statusCode: 404, code: "NOT_FOUND", message: `${fieldLabel} "${value}" not found` };
    return { id: doc._id, name: doc[nameField] };
  }

  return null;
}


function sanitizeFitting(fitting) {
  if (!fitting) return fitting;
  if (!fitting.hasFlatFitting) return { hasFlatFitting: false };

  const missing = [];
  if (fitting.dbl == null)        missing.push("fitting.dbl (DBL)");
  if (!fitting.frameType)         missing.push("fitting.frameType (Frame Type)");
  if (fitting.frameLength == null) missing.push("fitting.frameLength (Frame Length)");
  if (fitting.frameHeight == null) missing.push("fitting.frameHeight (Frame Height)");

  if (missing.length) {
    throw { statusCode: 400, code: "MISSING_FIELDS", message: `Fitting data required when hasFlatFitting is true: ${missing.join(", ")}` };
  }
  return fitting;
}


export async function createOrderService(data, userId) {
  const isDraft = data.status === "Draft";
  const { productMode, powerType, powers = [] } = data;

  data.fitting = sanitizeFitting(data.fitting);

  const [brandResolved, categoryResolved, productNameResolved, coatingResolved, treatmentResolved, tintResolved] = await Promise.all([
    data.brand       ? resolveDiigProductField("brand",    data.brand,     "Brand")     : null,
    data.category    ? resolveDiigProductField("category", data.category,  "Category")  : null,
    data.coating     ? resolveDiigProductField("coating",  data.coating,   "Coating")   : null,
    data.productName ? resolveDropdownField(DigiProduct,   data.productName, "Product", "productName") : null,
    data.treatment   ? resolveDropdownField(ProductTreatment, data.treatment, "Treatment") : null,
    data.tint        ? resolveDropdownField(Tint,             data.tint,      "Tint")      : null,
  ]);

  const missing = [];
  if (!data.customer?.customerId)    missing.push("customer.customerId");
  if (!data.customer?.customerShipToId) missing.push("customer.customerShipToId");
  if (missing.length) {
    throw { statusCode: 400, code: "MISSING_FIELDS", message: `Missing required fields: ${missing.join(", ")}` };
  }

  if (!isDraft) {
    const submitMissing = [];
    if (!brandResolved)     submitMissing.push("brand");
    if (!categoryResolved)  submitMissing.push("category");
    if (!productNameResolved) submitMissing.push("productName");
    if (!productMode)       submitMissing.push("productMode");
    if (!powerType)         submitMissing.push("powerType");
    if (!powers.length)     submitMissing.push("powers (at least one eye required)");
    if (!coatingResolved)   submitMissing.push("coating");
    if (data.index == null) submitMissing.push("index");
    if (!tintResolved)      submitMissing.push("tint");
    if (!treatmentResolved) submitMissing.push("treatment");

    if (submitMissing.length) {
      throw { statusCode: 400, code: "MISSING_FIELDS", message: `Missing required fields for submission: ${submitMissing.join(", ")}` };
    }

    if (!["Stock Lens", "Rx"].includes(productMode)) {
      throw { statusCode: 400, code: "INVALID_VALUE", message: `productMode must be "Stock Lens" or "Rx"` };
    }
    if (!["Single", "Both"].includes(powerType)) {
      throw { statusCode: 400, code: "INVALID_VALUE", message: `powerType must be "Single" or "Both"` };
    }
    for (const p of powers) {
      if (!["R", "L"].includes(p.side)) {
        throw { statusCode: 400, code: "INVALID_VALUE", message: `powers[].side must be "R" or "L"` };
      }
      if (p.sph == null) {
        throw { statusCode: 400, code: "MISSING_FIELDS", message: `powers[].sph is required for side "${p.side}"` };
      }
    }
    if (powerType === "Both") {
      const sides = powers.map((p) => p.side);
      if (!sides.includes("R") || !sides.includes("L")) {
        throw { statusCode: 400, code: "MISSING_FIELDS", message: `powerType is "Both" but powers must include both "R" and "L" sides` };
      }
    }
  }

  const customer = await Customer.findById(data.customer.customerId).lean();
  if (!customer) throw { statusCode: 404, code: "NOT_FOUND", message: "Customer not found" };
  if (!customer.status?.isActive) throw { statusCode: 403, code: "CUSTOMER_INACTIVE", message: "Customer account is not active" };

  let customerShipToBranchName = null;
  if (data.customer.customerShipToId) {
    const shipTo = (customer.customerShipToDetails || []).find(
      (s) => s._id.toString() === data.customer.customerShipToId.toString()
    );
    if (!shipTo) throw { statusCode: 404, code: "NOT_FOUND", message: "Ship-to address not found for this customer" };
    customerShipToBranchName = shipTo.branchName;
  }

  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    customer: {
      customerId:               customer._id,
      customerName:             customer.shopName,
      customerShipToId:         data.customer.customerShipToId ?? null,
      customerShipToBranchName: customerShipToBranchName,
    },
    orderReference:   data.orderReference,
    consumerCardName: data.consumerCardName,
    opticianName:     data.opticianName,
    powerType:        data.powerType,
    productMode:      data.productMode,
    hasPrism:         data.hasPrism ?? false,
    powers:           data.powers ?? [],
    prisms:           data.prisms ?? [],
    brand:            brandResolved,
    category:         categoryResolved,
    index:            data.index,
    productName:      productNameResolved,
    coating:          coatingResolved,
    treatment:        treatmentResolved,
    tint:             tintResolved,
    tintDetails:      data.tintDetails,
    remarks:          data.remarks,
    mirror:           data.mirror ?? false,
    centration:       data.centration ?? [],
    fitting:          data.fitting,
    lensData:         data.lensData,
    directCustomer:   data.directCustomer,
    shippingCharges:  data.shippingCharges ?? 0,
    otherCharges:     data.otherCharges ?? 0,
    status:           isDraft ? "Draft" : "Submitted",
    submittedAt:      isDraft ? null : new Date(),
    createdBy:        userId,
  });

  return order;
}


export async function getOrderService(orderId) {
  const order = await Order.findById(orderId)
    .populate("customer.customerId", "shopName ownerName customerCode mobileNo1 businessEmail customerBalance creditLimit creditUsed zone")
    .populate("createdBy", "employeeName email EmployeeType username")
    .lean();
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };
  return order;
}

export async function deleteOrderService(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };
  if (!["Draft", "Cancelled"].includes(order.status)) {
    throw { statusCode: 400, code: "INVALID_STATUS", message: `Cannot delete an order with status "${order.status}". Only Draft or Cancelled orders can be deleted.` };
  }
  await Order.findByIdAndDelete(orderId);
}

export async function listOrdersService({ customerId, status = "Submitted", page = 1, limit = 20, search, fromDate, toDate }) {
  const VALID_STATUSES = ["Draft", "Submitted", "Processing", "Completed", "Cancelled"];
  const filter = {};

  if (customerId) filter["customer.customerId"] = customerId;

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      throw { statusCode: 400, code: "INVALID_VALUE", message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` };
    }
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { orderNumber:    { $regex: search, $options: "i" } },
      { opticianName:   { $regex: search, $options: "i" } },
      { orderReference: { $regex: search, $options: "i" } },
    ];
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  return {
    orders,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function cancelOrderService(orderId, reason) {
  const order = await Order.findById(orderId);
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };
  if (order.status === "Draft") {
    throw { statusCode: 400, code: "INVALID_STATUS", message: "Cannot cancel a Draft order. Only submitted orders can be cancelled." };
  }
  if (!["Submitted"].includes(order.status)) {
    throw { statusCode: 400, code: "INVALID_STATUS", message: "Cannot cancel an order with status: " + order.status };
  }
  order.status = "Cancelled";
  order.cancelReason = reason || "";
  await order.save();
  return order;
}

export async function updateDraftOrderService(orderId, data) {
  const order = await Order.findById(orderId);
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };
  if (order.status !== "Draft" && order.status !== "Submitted") {
    throw { statusCode: 400, code: "INVALID_STATUS", message: "Only Draft or Submitted orders can be updated." };
  }

  if (data.fitting !== undefined) data.fitting = sanitizeFitting(data.fitting);

  if (data.brand)       data.brand       = await resolveDiigProductField("brand",    data.brand,     "Brand");
  if (data.category)    data.category    = await resolveDiigProductField("category", data.category,  "Category");
  if (data.coating)     data.coating     = await resolveDiigProductField("coating",  data.coating,   "Coating");
  if (data.productName) data.productName = await resolveDropdownField(DigiProduct,   data.productName, "Product", "productName");
  if (data.treatment)   data.treatment   = await resolveDropdownField(ProductTreatment, data.treatment, "Treatment");
  if (data.tint)        data.tint        = await resolveDropdownField(Tint,             data.tint,      "Tint");

  const brand       = (data.brand       || order.brand)?.name;
  const category    = (data.category    || order.category)?.name;
  const productName = (data.productName || order.productName)?.name;
  const productMode = data.productMode  || order.productMode;
  const powerType   = data.powerType    || order.powerType;
  const powers      = data.powers       || order.powers;

  if (data.status === "Submitted") {
    const submitMissing = [];
    if (!brand)          submitMissing.push("brand");
    if (!category)       submitMissing.push("category");
    if (!productName)    submitMissing.push("productName");
    if (!productMode)    submitMissing.push("productMode");
    if (!powerType)      submitMissing.push("powerType");
    if (!powers?.length) submitMissing.push("powers (at least one eye required)");

    const coating   = (data.coating   || order.coating)?.name;
    const treatment = (data.treatment || order.treatment)?.name;
    const tint      = (data.tint      || order.tint)?.name;
    const index     = data.index ?? order.index;

    if (!coating)       submitMissing.push("coating");
    if (index == null)  submitMissing.push("index");
    if (!tint)          submitMissing.push("tint");
    if (!treatment)     submitMissing.push("treatment");

    if (submitMissing.length) {
      throw { statusCode: 400, code: "MISSING_FIELDS", message: `Missing required fields for submission: ${submitMissing.join(", ")}` };
    }

    sanitizeFitting(data.fitting ?? order.fitting);

    if (!["Stock Lens", "Rx"].includes(productMode)) {
      throw { statusCode: 400, code: "INVALID_VALUE", message: `productMode must be "Stock Lens" or "Rx"` };
    }
    if (!["Single", "Both"].includes(powerType)) {
      throw { statusCode: 400, code: "INVALID_VALUE", message: `powerType must be "Single" or "Both"` };
    }
    for (const p of powers) {
      if (!["R", "L"].includes(p.side)) {
        throw { statusCode: 400, code: "INVALID_VALUE", message: `powers[].side must be "R" or "L"` };
      }
      if (p.sph == null) {
        throw { statusCode: 400, code: "MISSING_FIELDS", message: `powers[].sph is required for side "${p.side}"` };
      }
    }
    if (powerType === "Both") {
      const sides = powers.map((p) => p.side);
      if (!sides.includes("R") || !sides.includes("L")) {
        throw { statusCode: 400, code: "MISSING_FIELDS", message: `powerType is "Both" but powers must include both "R" and "L" sides` };
      }
    }
    data.submittedAt = new Date();
  }

  if (data.customer) {
    if (data.customer.customerId) {
      const customer = await Customer.findById(data.customer.customerId).lean();
      if (!customer) throw { statusCode: 404, code: "NOT_FOUND", message: "Customer not found" };

      let customerShipToBranchName = order.customer.customerShipToBranchName;
      const shipToId = data.customer.customerShipToId || order.customer.customerShipToId;
      if (shipToId) {
        const shipTo = (customer.customerShipToDetails || []).find(
          (s) => s._id.toString() === shipToId.toString()
        );
        if (!shipTo) throw { statusCode: 404, code: "NOT_FOUND", message: "Ship-to address not found for this customer" };
        customerShipToBranchName = shipTo.branchName;
      }
      order.customer = {
        customerId:               customer._id,
        customerName:             customer.shopName,
        customerShipToId:         shipToId ?? null,
        customerShipToBranchName: customerShipToBranchName,
      };
    } else if (data.customer.customerShipToId) {
      const customer = await Customer.findById(order.customer.customerId).lean();
      const shipTo = (customer?.customerShipToDetails || []).find(
        (s) => s._id.toString() === data.customer.customerShipToId.toString()
      );
      if (!shipTo) throw { statusCode: 404, code: "NOT_FOUND", message: "Ship-to address not found for this customer" };
      order.customer.customerShipToId         = data.customer.customerShipToId;
      order.customer.customerShipToBranchName = shipTo.branchName;
    }
  }

  const UPDATABLE = [
    "lab", "orderReference", "consumerCardName", "opticianName",
    "powerType", "productMode", "hasPrism", "powers", "prisms",
    "brand", "category", "index", "productName", "coating", "treatment",
    "tint", "tintDetails", "remarks", "mirror", "resolved", "suppliers",
    "centration", "fitting", "lensData",
    "directCustomer", "shippingCharges", "otherCharges", "status",
  ];
  UPDATABLE.forEach((key) => { if (data[key] !== undefined) order[key] = data[key]; });

  await order.save();
  return order;
}

export async function getTintOptionsService() {
  return await Tint.find({}).sort({ name: 1 }).lean();
}

export async function getFrameTypesService() {
  return await FrameType.find({}).sort({ name: 1 }).lean();
}

export async function getProductBrandsService() {
  return await DigiProduct.aggregate([
    { $match: { brand: { $nin: [null, ""] } } },
    { $sort:  { brand: 1, createdAt: 1 } },
    {
      $group: {
        _id:       "$brand",
        docId:     { $first: "$_id" },
        name:      { $first: "$brand" },
        __v:       { $first: "$__v" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    },
    { $sort: { name: 1 } },
    {
      $project: {
        _id:       "$docId",
        name:      1,
        __v:       1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);
}

export async function getProductCategoriesService({ brand } = {}) {
  const match = { category: { $nin: [null, ""] } };
  if (brand?.trim()) match.brand = { $regex: `^${brand.trim()}$`, $options: "i" };

  return await DigiProduct.aggregate([
    { $match: match },
    { $sort:  { category: 1, createdAt: 1 } },
    {
      $group: {
        _id:       "$category",
        docId:     { $first: "$_id" },
        name:      { $first: "$category" },
        __v:       { $first: "$__v" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    },
    { $sort: { name: 1 } },
    {
      $project: {
        _id:       "$docId",
        name:      1,
        __v:       1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);
}

export async function getProductCoatingsService({ brand, category } = {}) {
  const match = { coating: { $nin: [null, ""] } };
  if (brand?.trim())    match.brand    = { $regex: `^${brand.trim()}$`,    $options: "i" };
  if (category?.trim()) match.category = { $regex: `^${category.trim()}$`, $options: "i" };

  return await DigiProduct.aggregate([
    { $match: match },
    { $sort:  { coating: 1, createdAt: 1 } },
    {
      $group: {
        _id:       "$coating",
        docId:     { $first: "$_id" },
        name:      { $first: "$coating" },
        __v:       { $first: "$__v" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    },
    { $sort: { name: 1 } },
    {
      $project: {
        _id:       "$docId",
        name:      1,
        __v:       1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);
}

export async function getProductNamesService({ brand, category, search = "", limit = 100, page = 1 }) {
  const filter = { productName: { $nin: [null, ""] } };
  if (brand?.trim())    filter.brand    = { $regex: `^${brand.trim()}$`,    $options: "i" };
  if (category?.trim()) filter.category = { $regex: `^${category.trim()}$`, $options: "i" };
  if (search.trim())    filter.productName = { $regex: search.trim(), $options: "i" };

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await DigiProduct.countDocuments(filter);

  const data = await DigiProduct.find(filter, {
    _id: 1, productName: 1, brand: 1, category: 1, coating: 1,
    price: 1, mrp: 1, gst: 1, qty: 1, createdAt: 1, updatedAt: 1, __v: 1,
  }).sort({ productName: 1 }).skip(skip).limit(parseInt(limit)).lean();

  return {
    data,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function getProductTreatmentsService() {
  return await ProductTreatment.find({}).sort({ name: 1 }).lean();
}

export async function getProductIndexesService() {
  return await DigiProduct.aggregate([
    { $match: { index: { $nin: [null, ""] } } },
    { $sort:  { index: 1, createdAt: 1 } },
    {
      $group: {
        _id:       "$index",
        docId:     { $first: "$_id" },
        value:     { $first: { $toDouble: "$index" } },
        __v:       { $first: "$__v" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    },
    { $sort: { value: 1 } },
    {
      $project: {
        _id:       "$docId",
        value:     1,
        __v:       1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);
}

export async function getProductTypesService() {
  return await ProductType.find({}).sort({ name: 1 }).lean();
}
