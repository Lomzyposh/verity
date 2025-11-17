import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const discountSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: false,
    },
    // "percentage" = 20% off, "flat" = 5000 NGN off
    type: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },
    value: {
      type: Number, // e.g. 10 = 10%, or 5000 = 5k off
      min: 0,
    },
    startsAt: Date,
    endsAt: Date,
  },
  { _id: false }
);

const jewelryItemSchema = new mongoose.Schema(
  {
    // BASIC INFO
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    sku: {
      type: String, // internal code if you want
      unique: true,
      sparse: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // CATEGORIZATION / FILTERS
    category: {
      type: String,
      enum: [
        "ring",
        "necklace",
        "earring",
        "bracelet",
        "anklet",
        "pendant",
        "set",
        "other",
      ],
      index: true,
    },
    subcategory: {
      type: String, // e.g. "engagement", "wedding", "daily wear"
      trim: true,
      index: true,
    },

    // MATERIAL / KARAT / STYLE FILTERS
    metalType: {
      type: String,
      enum: ["gold", "silver", "platinum", "stainless steel", "other"],
      index: true,
    },
    karat: {
      type: Number, // e.g. 14, 18, 22
      min: 1,
      max: 24,
      index: true,
    },
    metalColor: {
      type: String, // "yellow", "white", "rose", "two-tone", etc.
      trim: true,
      index: true,
    },
    stoneType: {
      type: String, // "diamond", "moissanite", "cz", "none", etc.
      trim: true,
      index: true,
    },
    stoneColor: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["mens", "womens", "unisex"],
      default: "unisex",
      index: true,
    },

    occasions: [
      {
        type: String, // e.g. "wedding", "gift", "party"
        trim: true,
      },
    ],

    styleTags: [
      {
        type: String, // e.g. "minimal", "bold", "vintage"
        trim: true,
      },
    ],

    // PRICING
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "NGN",
    },

    discount: discountSchema, // optional, only active when isActive=true

    // IMAGES
    images: {
      type: [imageSchema],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "At least one product image is required",
      },
    },

    // INVENTORY / FLAGS
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// VIRTUAL: final price after discount (if any & active)
jewelryItemSchema.virtual("finalPrice").get(function () {
  if (!this.discount || !this.discount.isActive || !this.discount.value) {
    return this.price;
  }

  const now = new Date();
  if (
    (this.discount.startsAt && this.discount.startsAt > now) ||
    (this.discount.endsAt && this.discount.endsAt < now)
  ) {
    return this.price;
  }

  if (this.discount.type === "percentage") {
    const discountAmount = (this.price * this.discount.value) / 100;
    return Math.max(this.price - discountAmount, 0);
  }

  if (this.discount.type === "flat") {
    return Math.max(this.price - this.discount.value, 0);
  }

  return this.price;
});

// Simple text search on name + description + styleTags
jewelryItemSchema.index({
  name: "text",
  description: "text",
  styleTags: "text",
});

const JewelryItem = mongoose.model("JewelryItem", jewelryItemSchema);

export default JewelryItem;