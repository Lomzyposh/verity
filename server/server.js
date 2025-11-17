import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import axios from "axios";
import { body, validationResult } from "express-validator";
import slugify from "slugify";

dotenv.config();

const app = express();

// MIDDLEWARE
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// MONGODB CONNECTION
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/veritygem", {
    dbName: "veritygem",
  })
  .then(() => console.log("✅ MongoDB Connected - Verity Gem"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// EMAIL CONFIGURATION
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const smtpTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // Explicitly use STARTTLS port
  secure: false, // false because we're using STARTTLS, not SSL 465
  auth: {
    user: process.env.MAIL_USER, // your Gmail / business mail
    pass: process.env.MAIL_PASS, // ⚠️ must be an App Password
  },
  pool: true, // reuse connections
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 10000, // 10s
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

async function sendResetCodeEmail(to, code) {
  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827;">
      <h2 style="margin-bottom: 8px;">Password Reset Code</h2>
      <p style="margin-bottom: 16px;">Use the code below to reset your VerityGem account password:</p>
      <div style="font-size: 24px; letter-spacing: 0.3em; font-weight: 600; margin-bottom: 16px;">
        ${code}
      </div>
      <p style="font-size: 14px; color: #4B5563;">
        This code will expire in 15 minutes. If you didn&apos;t request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await smtpTransporter.sendMail({
    from: process.env.SMTP_USER || '"VerityGem" <no-reply@veritygem.com>',
    to,
    subject: "Your VerityGem password reset code",
    html,
  });
}

const sendEmail = async (to, subject, html) => {
  try {
    await sgMail.send({
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME,
      },
      subject,
      html,
    });
    console.log("✅ Email sent via SendGrid");
    return true;
  } catch (error) {
    console.log("⚠️ SendGrid failed, trying SMTP...", error.message);
    try {
      await smtpTransporter.sendMail({
        from: `"${process.env.SENDGRID_FROM_NAME}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log("✅ Email sent via SMTP");
      return true;
    } catch (smtpError) {
      console.error("❌ Email sending failed:", smtpError.message);
      return false;
    }
  }
};

// MONGODB SCHEMAS
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const discountSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: false },
    type: { type: String, enum: ["percentage", "flat"], default: "percentage" },
    value: { type: Number, min: 0 },
    startsAt: Date,
    endsAt: Date,
  },
  { _id: false }
);

const jewelryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true, trim: true },
    sku: { type: String, unique: true, sparse: true, trim: true },
    description: { type: String, trim: true },
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
    subcategory: { type: String, trim: true, index: true },
    metalType: {
      type: String,
      enum: ["gold", "silver", "platinum", "stainless steel", "other"],
      index: true,
    },
    karat: { type: Number, min: 1, max: 24, index: true },
    metalColor: { type: String, trim: true, index: true },
    stoneType: { type: String, trim: true, index: true },
    stoneColor: { type: String, trim: true },
    gender: {
      type: String,
      enum: ["mens", "womens", "unisex"],
      default: "unisex",
      index: true,
    },
    occasions: [{ type: String, trim: true }],
    styleTags: [{ type: String, trim: true }],
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    discount: discountSchema,
    images: {
      type: [imageSchema],
      validate: {
        validator: (val) => Array.isArray(val) && val.length > 0,
        message: "At least one product image is required",
      },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    engraving: {
      available: { type: Boolean, default: false },
      maxLength: { type: Number, default: 20 },
      price: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

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

jewelryItemSchema.index({
  name: "text",
  description: "text",
  styleTags: "text",
});

jewelryItemSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const JewelryItem = mongoose.model("JewelryItem", jewelryItemSchema);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    shippingAddresses: [
      {
        fullName: String,
        phone: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "JewelryItem" }],
    currency: { type: String, default: "USD" },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: { type: Date, default: Date.now },
    resetCode: {
      type: String,
      default: null,
    },
    resetCodeExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const cartItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: String,
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "JewelryItem" },
      quantity: { type: Number, default: 1, min: 1 },
      customization: {
        engraving: String,
        metalType: String,
        stoneType: String,
      },
      priceAtAdd: Number,
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

const Cart = mongoose.model("Cart", cartItemSchema);

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  guestEmail: String,
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "JewelryItem" },
      name: String,
      quantity: Number,
      price: Number,
      customization: {
        engraving: String,
        metalType: String,
        stoneType: String,
      },
    },
  ],
  subtotal: Number,
  shippingCost: Number,
  tax: Number,
  total: Number,
  currency: { type: String, default: "USD" },
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  paymentMethod: String,
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  orderStatus: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  trackingNumber: String,
  returnRequest: {
    requested: { type: Boolean, default: false },
    reason: String,
    requestedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
});

orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `VG${Date.now()}-${(count + 1)
      .toString()
      .padStart(5, "0")}`;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

const giftCardSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  balance: { type: Number, required: true },
  purchaser: {
    name: String,
    email: String,
  },
  recipient: {
    name: String,
    email: String,
  },
  message: String,
  images: {
    front: String,
    back: String,
  },
  isActive: { type: Boolean, default: true },
  expiresAt: Date,
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

const GiftCard = mongoose.model("GiftCard", giftCardSchema);

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  excerpt: String,
  featuredImage: String,
  category: String,
  tags: [String],
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

blogPostSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

const appointmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  preferredDate: Date,
  message: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

const paymentMethodSchema = new mongoose.Schema({
  method: { type: String, required: true, unique: true },
  displayName: String,
  instructions: String,
  accountDetails: mongoose.Schema.Types.Mixed,
  isActive: { type: Boolean, default: true },
});

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

// AUTHENTICATION MIDDLEWARE
const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");
    if (!req.user) {
      return res.status(401).json({ error: "User not found" });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");
    }
  } catch (error) {
    // Continue without authentication
  }
  next();
};

// HELPER FUNCTIONS
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.SESSION_EXPIRY || "7d",
  });
};

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  try {
    const response = await axios.get(
      `${
        process.env.CURRENCY_API_URL ||
        "https://api.exchangerate-api.com/v4/latest"
      }/${fromCurrency}`
    );
    const rate = response.data.rates[toCurrency];
    return amount * rate;
  } catch (error) {
    console.error("Currency conversion error:", error.message);
    return amount;
  }
};

// EMAIL TEMPLATES
const emailTemplates = {
  welcome: (name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Georgia', serif; background-color: #F5F5F7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E5E7EB; }
        .header { background: linear-gradient(135deg, #4B5563 0%, #374151 100%); padding: 40px; text-align: center; }
        .logo { color: #FFFFFF; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
        .content { padding: 40px; color: #111827; }
        .button { display: inline-block; background: #4B5563; color: #FFFFFF; padding: 14px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background: #F5F5F7; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VERITY GEM</div>
        </div>
        <div class="content">
          <h2 style="color: #111827; margin-top: 0;">Welcome to Verity Gem, ${name}</h2>
          <p style="line-height: 1.8; color: #374151;">
            Thank you for joining our distinguished collection of jewelry enthusiasts. We're delighted to have you as part of the Verity Gem family.
          </p>
          <p style="line-height: 1.8; color: #374151;">
            Explore our curated selection of exquisite pieces, each crafted with precision and timeless elegance.
          </p>
          <a href="${
            process.env.CLIENT_URL
          }/shop" class="button">Explore Collection</a>
          <p style="line-height: 1.8; color: #6B7280; font-size: 14px; margin-top: 30px;">
            If you have any questions, our concierge team is always here to assist you.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Verity Gem. All rights reserved.</p>
          <p>Crafting Timeless Elegance</p>
        </div>
      </div>
    </body>
    </html>
  `,

  orderConfirmation: (order, items) => {
    const itemsList = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">${
          item.name
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">${
          order.currency
        } ${item.price.toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Georgia', serif; background-color: #F5F5F7; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E5E7EB; }
          .header { background: linear-gradient(135deg, #4B5563 0%, #374151 100%); padding: 40px; text-align: center; }
          .logo { color: #FFFFFF; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 40px; color: #111827; }
          .order-box { background: #F5F5F7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .footer { background: #F5F5F7; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VERITY GEM</div>
          </div>
          <div class="content">
            <h2 style="color: #111827; margin-top: 0;">Order Confirmation</h2>
            <p style="line-height: 1.8; color: #374151;">
              Thank you for your purchase. Your order has been confirmed and will be carefully prepared for shipment.
            </p>
            <div class="order-box">
              <p style="margin: 0; color: #6B7280; font-size: 14px;">Order Number</p>
              <p style="margin: 5px 0 0 0; color: #111827; font-size: 20px; font-weight: bold;">${
                order.orderNumber
              }</p>
            </div>
            <table>
              <thead>
                <tr style="background: #F5F5F7;">
                  <th style="padding: 12px; text-align: left; color: #6B7280; font-weight: 600;">Item</th>
                  <th style="padding: 12px; text-align: center; color: #6B7280; font-weight: 600;">Qty</th>
                  <th style="padding: 12px; text-align: right; color: #6B7280; font-weight: 600;">Price</th>
                </tr>
              </thead>
              <tbody>${itemsList}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Subtotal:</td>
                  <td style="padding: 12px; text-align: right;">${
                    order.currency
                  } ${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Shipping:</td>
                  <td style="padding: 12px; text-align: right;">${
                    order.currency
                  } ${order.shippingCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Tax:</td>
                  <td style="padding: 12px; text-align: right;">${
                    order.currency
                  } ${order.tax.toFixed(2)}</td>
                </tr>
                <tr style="background: #F5F5F7; font-size: 18px;">
                  <td colspan="2" style="padding: 16px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 16px; text-align: right; font-weight: bold;">${
                    order.currency
                  } ${order.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <h3 style="color: #111827; margin-top: 30px;">Shipping Address</h3>
            <p style="line-height: 1.6; color: #374151;">
              ${order.shippingAddress.fullName}<br>
              ${order.shippingAddress.addressLine1}<br>
              ${
                order.shippingAddress.addressLine2
                  ? order.shippingAddress.addressLine2 + "<br>"
                  : ""
              }
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${
      order.shippingAddress.postalCode
    }<br>
              ${order.shippingAddress.country}
            </p>
            <p style="line-height: 1.8; color: #6B7280; font-size: 14px; margin-top: 30px;">
              You will receive a shipping notification with tracking information once your order is dispatched.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Verity Gem. All rights reserved.</p>
            <p>Questions? Contact us at ${process.env.ADMIN_EMAIL}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  passwordReset: (name, resetUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Georgia', serif; background-color: #F5F5F7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E5E7EB; }
        .header { background: linear-gradient(135deg, #4B5563 0%, #374151 100%); padding: 40px; text-align: center; }
        .logo { color: #FFFFFF; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
        .content { padding: 40px; color: #111827; }
        .button { display: inline-block; background: #4B5563; color: #FFFFFF; padding: 14px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background: #F5F5F7; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VERITY GEM</div>
        </div>
        <div class="content">
          <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>
          <p style="line-height: 1.8; color: #374151;">Hello ${name},</p>
          <p style="line-height: 1.8; color: #374151;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p style="line-height: 1.8; color: #6B7280; font-size: 14px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Verity Gem. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  shippingUpdate: (order, trackingNumber) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Georgia', serif; background-color: #F5F5F7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E5E7EB; }
        .header { background: linear-gradient(135deg, #4B5563 0%, #374151 100%); padding: 40px; text-align: center; }
        .logo { color: #FFFFFF; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
        .content { padding: 40px; color: #111827; }
        .tracking-box { background: #F5F5F7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .footer { background: #F5F5F7; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VERITY GEM</div>
        </div>
        <div class="content">
          <h2 style="color: #111827; margin-top: 0;">Your Order Has Shipped</h2>
          <p style="line-height: 1.8; color: #374151;">
            Great news! Your order <strong>${
              order.orderNumber
            }</strong> has been shipped and is on its way to you.
          </p>
          <div class="tracking-box">
            <p style="margin: 0; color: #6B7280; font-size: 14px;">Tracking Number</p>
            <p style="margin: 10px 0 0 0; color: #111827; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${trackingNumber}</p>
          </div>
          <p style="line-height: 1.8; color: #374151;">
            Your package will arrive within 5-7 business days for international shipments. You can track your order using the tracking number above.
          </p>
          <p style="line-height: 1.8; color: #6B7280; font-size: 14px; margin-top: 30px;">
            Thank you for choosing Verity Gem. We hope you love your new piece.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Verity Gem. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  appointmentConfirmation: (appointment) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Georgia', serif; background-color: #F5F5F7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E5E7EB; }
        .header { background: linear-gradient(135deg, #4B5563 0%, #374151 100%); padding: 40px; text-align: center; }
        .logo { color: #FFFFFF; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
        .content { padding: 40px; color: #111827; }
        .footer { background: #F5F5F7; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VERITY GEM</div>
        </div>
        <div class="content">
          <h2 style="color: #111827; margin-top: 0;">Appointment Request Received</h2>
          <p style="line-height: 1.8; color: #374151;">Dear ${
            appointment.name
          },</p>
          <p style="line-height: 1.8; color: #374151;">
            Thank you for your interest in scheduling an appointment with Verity Gem. We have received your request and our team will contact you shortly to confirm the details.
          </p>
          <p style="line-height: 1.8; color: #374151;">
            <strong>Preferred Date:</strong> ${new Date(
              appointment.preferredDate
            ).toLocaleDateString()}<br>
            <strong>Contact Email:</strong> ${appointment.email}
          </p>
          <p style="line-height: 1.8; color: #6B7280; font-size: 14px; margin-top: 30px;">
            We look forward to assisting you with your jewelry needs.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Verity Gem. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    // await sendEmail(email, 'Welcome to Verity Gem', emailTemplates.welcome(name));
    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      currency: req.user.currency,
    },
  });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether user exists or not
      return res.json({
        message: "If that email is registered, a reset code has been sent.",
      });
    }

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetCode = code;
    user.resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    await sendEmail(
      email,
      "Password Reset Code - GoTickets",
      `<h2>Password Reset</h2><p>Your reset code is: <strong>${code}</strong></p><p>This code expires in 1 hour.</p>`
    );

    res.json({
      message: "If that email is registered, a reset code has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res
      .status(500)
      .json({ error: "Unable to process request. Please try again." });
  }
});
app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, code and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetCode || !user.resetCodeExpiresAt) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const now = new Date();
    if (
      user.resetCode !== code ||
      user.resetCodeExpiresAt.getTime() < now.getTime()
    ) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    // Hash the new password with bcrypt before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpiresAt = null;
    await user.save();

    res.json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res
      .status(500)
      .json({ error: "Unable to reset password. Please try again." });
  }
});

// PRODUCT ROUTES
app.get("/api/products", async (req, res) => {
  try {
    const {
      category,
      subcategory,
      metalType,
      karat,
      metalColor,
      stoneType,
      gender,
      minPrice,
      maxPrice,
      search,
      sort,
      page = 1,
      limit = 20,
      featured,
    } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (metalType) query.metalType = metalType;
    if (karat) query.karat = parseInt(karat);
    if (metalColor) query.metalColor = metalColor;
    if (stoneType) query.stoneType = stoneType;
    if (gender) query.gender = gender;
    if (featured === "true") query.isFeatured = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }
    let sortOptions = {};
    switch (sort) {
      case "price-asc":
        sortOptions = { price: 1 };
        break;
      case "price-desc":
        sortOptions = { price: -1 };
        break;
      case "rating":
        sortOptions = { rating: -1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await JewelryItem.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await JewelryItem.countDocuments(query);
    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasMore: skip + products.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/:slug", async (req, res) => {
  try {
    const product = await JewelryItem.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/featured/list", async (req, res) => {
  try {
    const products = await JewelryItem.find({
      isFeatured: true,
      isActive: true,
    })
      .limit(8)
      .sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/filters/options", async (req, res) => {
  try {
    const categories = await JewelryItem.distinct("category", {
      isActive: true,
    });
    const metalTypes = await JewelryItem.distinct("metalType", {
      isActive: true,
    });
    const metalColors = await JewelryItem.distinct("metalColor", {
      isActive: true,
    });
    const stoneTypes = await JewelryItem.distinct("stoneType", {
      isActive: true,
    });
    const karats = await JewelryItem.distinct("karat", { isActive: true });
    const priceRange = await JewelryItem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);
    res.json({
      categories: categories.filter(Boolean),
      metalTypes: metalTypes.filter(Boolean),
      metalColors: metalColors.filter(Boolean),
      stoneTypes: stoneTypes.filter(Boolean),
      karats: karats.filter(Boolean).sort((a, b) => a - b),
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 10000 },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FAVORITES ROUTES
app.get("/api/favorites", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("favorites");
    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/favorites/:productId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.favorites.includes(req.params.productId)) {
      return res.status(400).json({ error: "Already in favorites" });
    }
    user.favorites.push(req.params.productId);
    await user.save();
    res.json({ message: "Added to favorites", favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/favorites/:productId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.favorites = user.favorites.filter(
      (id) => id.toString() !== req.params.productId
    );
    await user.save();
    res.json({ message: "Removed from favorites", favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CART ROUTES
app.get("/api/cart", optionalAuthMiddleware, async (req, res) => {
  try {
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product"
      );
    } else {
      const sessionId = req.query.sessionId;
      if (sessionId) {
        cart = await Cart.findOne({ sessionId }).populate("items.product");
      }
    }
    res.json({ cart: cart || { items: [] } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/cart", optionalAuthMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1, customization, sessionId } = req.body;
    const product = await JewelryItem.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }
    } else {
      cart = await Cart.findOne({ sessionId });
      if (!cart) {
        cart = new Cart({ sessionId, items: [] });
      }
    }
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        JSON.stringify(item.customization) === JSON.stringify(customization)
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        customization,
        priceAtAdd: product.finalPrice,
      });
    }
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate("items.product");
    res.json({ cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/cart/:itemId", optionalAuthMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else {
      cart = await Cart.findOne({ sessionId: req.query.sessionId });
    }
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }
    if (quantity <= 0) {
      item.remove();
    } else {
      item.quantity = quantity;
    }
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate("items.product");
    res.json({ cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/cart/:itemId", optionalAuthMiddleware, async (req, res) => {
  try {
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else {
      cart = await Cart.findOne({ sessionId: req.query.sessionId });
    }
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate("items.product");
    res.json({ cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/cart/sync", authMiddleware, async (req, res) => {
  try {
    const { guestCart } = req.body;
    let userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart) {
      userCart = new Cart({ user: req.user._id, items: [] });
    }
    for (const guestItem of guestCart) {
      const existingItem = userCart.items.find(
        (item) =>
          item.product.toString() === guestItem.productId &&
          JSON.stringify(item.customization) ===
            JSON.stringify(guestItem.customization)
      );
      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        userCart.items.push({
          product: guestItem.productId,
          quantity: guestItem.quantity,
          customization: guestItem.customization,
          priceAtAdd: guestItem.price,
        });
      }
    }
    await userCart.save();
    await userCart.populate("items.product");
    res.json({ cart: userCart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ORDER ROUTES
app.post("/api/orders", optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      currency = "USD",
      guestEmail,
    } = req.body;
    if (!req.user && !guestEmail) {
      return res
        .status(400)
        .json({ error: "Email required for guest checkout" });
    }
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await JewelryItem.findById(item.productId);
      if (!product) continue;
      const itemTotal = product.finalPrice * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.finalPrice,
        customization: item.customization,
      });
    }
    const shippingCost = 50;
    const tax = subtotal * 0.1;
    const total = subtotal + shippingCost + tax;
    const order = new Order({
      user: req.user?._id,
      guestEmail,
      items: orderItems,
      subtotal,
      shippingCost,
      tax,
      total,
      currency,
      shippingAddress,
      paymentMethod,
    });
    await order.save();
    await order.populate("items.product");
    const emailTo = req.user?.email || guestEmail;
    await sendEmail(
      emailTo,
      `Order Confirmation - ${order.orderNumber}`,
      emailTemplates.orderConfirmation(order, orderItems)
    );
    if (req.user) {
      await Cart.findOneAndDelete({ user: req.user._id });
    }
    res.json({ order, message: "Order placed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get(
  "/api/orders/:orderNumber",
  optionalAuthMiddleware,
  async (req, res) => {
    try {
      const query = { orderNumber: req.params.orderNumber };
      if (req.user) {
        query.user = req.user._id;
      } else {
        query.guestEmail = req.query.email;
      }
      const order = await Order.findOne(query).populate("items.product");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.post("/api/orders/:orderId/return", authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    order.returnRequest = {
      requested: true,
      reason,
      requestedAt: new Date(),
    };
    await order.save();
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `Return Request - ${order.orderNumber}`,
      `<p>Return requested for order ${order.orderNumber}</p><p>Reason: ${reason}</p>`
    );
    res.json({ message: "Return request submitted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// USER PROFILE ROUTES
app.get("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone, currency } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (currency) user.currency = currency;
    await user.save();
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/user/addresses", authMiddleware, async (req, res) => {
  try {
    const address = req.body;
    const user = await User.findById(req.user._id);
    if (address.isDefault) {
      user.shippingAddresses.forEach((addr) => (addr.isDefault = false));
    }
    user.shippingAddresses.push(address);
    await user.save();
    res.json({ addresses: user.shippingAddresses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/addresses/:addressId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.shippingAddresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }
    Object.assign(address, req.body);
    if (address.isDefault) {
      user.shippingAddresses.forEach((addr) => {
        if (addr._id.toString() !== req.params.addressId) {
          addr.isDefault = false;
        }
      });
    }
    await user.save();
    res.json({ addresses: user.shippingAddresses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete(
  "/api/user/addresses/:addressId",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      user.shippingAddresses = user.shippingAddresses.filter(
        (addr) => addr._id.toString() !== req.params.addressId
      );
      await user.save();
      res.json({ addresses: user.shippingAddresses });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GIFT CARD ROUTES
app.post("/api/gift-cards", async (req, res) => {
  try {
    const { amount, currency, purchaser, recipient, message, images } =
      req.body;
    const code = `VG${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substr(2, 5)
      .toUpperCase()}`;
    const giftCard = new GiftCard({
      code,
      amount,
      currency,
      balance: amount,
      purchaser,
      recipient,
      message,
      images,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    await giftCard.save();
    await sendEmail(
      recipient.email,
      "You Received a Verity Gem Gift Card!",
      `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: 'Georgia', serif; background-color: #F5F5F7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E5E7EB; }
        .header { background: linear-gradient(135deg, #4B5563 0%, #374151 100%); padding: 40px; text-align: center; }
        .logo { color: #FFFFFF; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
        .content { padding: 40px; color: #111827; }
        .gift-card { background: linear-gradient(135deg, #4B5563 0%, #374151 100%); color: #FFFFFF; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
        .code { font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 15px 0; }
        .footer { background: #F5F5F7; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header"><div class="logo">VERITY GEM</div></div>
          <div class="content">
            <h2 style="color: #111827; margin-top: 0;">You've Received a Gift!</h2>
            <p style="line-height: 1.8; color: #374151;">${
              purchaser.name
            } has sent you a Verity Gem gift card!</p>
            ${
              message
                ? `<p style="line-height: 1.8; color: #374151; font-style: italic;">"${message}"</p>`
                : ""
            }
            <div class="gift-card">
              <h3 style="margin: 0;">Gift Card Value</h3>
              <div style="font-size: 36px; font-weight: bold; margin: 15px 0;">${currency} ${amount}</div>
              <p style="margin: 10px 0 5px 0; font-size: 14px;">Your Gift Card Code:</p>
              <div class="code">${code}</div>
              <p style="font-size: 12px; margin-top: 15px; opacity: 0.8;">Valid for 1 year from today</p>
            </div>
            <p style="line-height: 1.8; color: #374151; text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/shop" style="display: inline-block; background: #4B5563; color: #FFFFFF; padding: 14px 30px; text-decoration: none; border-radius: 4px; margin: 10px 0;">Shop Now</a>
            </p>
          </div>
          <div class="footer"><p>© ${new Date().getFullYear()} Verity Gem. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
    );
    res.json({ giftCard: { code, amount, currency } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/gift-cards/:code", async (req, res) => {
  try {
    const giftCard = await GiftCard.findOne({
      code: req.params.code,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    if (!giftCard) {
      return res.status(404).json({ error: "Invalid or expired gift card" });
    }
    res.json({ balance: giftCard.balance, currency: giftCard.currency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// APPOINTMENT ROUTES
app.post("/api/appointments", async (req, res) => {
  try {
    const { name, email, phone, preferredDate, message } = req.body;
    const appointment = new Appointment({
      name,
      email,
      phone,
      preferredDate,
      message,
    });
    await appointment.save();
    await sendEmail(
      email,
      "Appointment Request Confirmation - Verity Gem",
      emailTemplates.appointmentConfirmation(appointment)
    );
    await sendEmail(
      process.env.ADMIN_EMAIL,
      "New Appointment Request",
      `
      <p><strong>New appointment request received:</strong></p>
      <p>Name: ${name}<br>Email: ${email}<br>Phone: ${phone}<br>
      Preferred Date: ${new Date(
        preferredDate
      ).toLocaleDateString()}<br>Message: ${message}</p>
    `
    );
    res.json({ message: "Appointment request submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BLOG ROUTES
app.get("/api/blog", async (req, res) => {
  try {
    const { category, tag, page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    if (tag) query.tags = tag;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const posts = await BlogPost.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await BlogPost.countDocuments(query);
    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/blog/:slug", async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      isPublished: true,
    });
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CURRENCY CONVERSION
app.get("/api/currency/rates", async (req, res) => {
  try {
    const { base = "USD" } = req.query;
    const response = await axios.get(
      `${
        process.env.CURRENCY_API_URL ||
        "https://api.exchangerate-api.com/v4/latest"
      }/${base}`
    );
    res.json({ rates: response.data.rates, base });
  } catch (error) {
    res.status(500).json({ error: "Currency service unavailable" });
  }
});

app.post("/api/currency/convert", async (req, res) => {
  try {
    const { amount, from, to } = req.body;
    const converted = await convertCurrency(amount, from, to);
    res.json({ original: amount, converted, from, to });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PAYMENT METHOD CONFIG
app.get("/api/payment-methods", async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ isActive: true }).select("-__v");
    res.json({ methods });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UTILITY ROUTES
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date(), service: "Verity Gem API" });
});

app.get("/api/size-guides", (req, res) => {
  res.json({
    rings: {
      us: [
        { size: "4", diameter: "14.9mm", circumference: "46.8mm" },
        { size: "5", diameter: "15.7mm", circumference: "49.3mm" },
        { size: "6", diameter: "16.5mm", circumference: "51.9mm" },
        { size: "7", diameter: "17.3mm", circumference: "54.4mm" },
        { size: "8", diameter: "18.2mm", circumference: "57.0mm" },
        { size: "9", diameter: "19.0mm", circumference: "59.5mm" },
        { size: "10", diameter: "19.8mm", circumference: "62.1mm" },
      ],
    },
    necklaces: {
      lengths: [
        {
          name: "Choker",
          length: "14-16 inches",
          description: "Sits high on neck",
        },
        {
          name: "Princess",
          length: "17-19 inches",
          description: "Classic length, sits above collarbone",
        },
        {
          name: "Matinee",
          length: "20-24 inches",
          description: "Falls to top of bust",
        },
        {
          name: "Opera",
          length: "28-36 inches",
          description: "Falls to mid-bust",
        },
        {
          name: "Rope",
          length: "37+ inches",
          description: "Very long, can be doubled",
        },
      ],
    },
    bracelets: {
      sizes: [
        { size: "Extra Small", wrist: "5.5-6 inches" },
        { size: "Small", wrist: "6-6.5 inches" },
        { size: "Medium", wrist: "6.5-7 inches" },
        { size: "Large", wrist: "7-7.5 inches" },
        { size: "Extra Large", wrist: "7.5-8 inches" },
      ],
    },
  });
});

app.get("/api/shipping-info", (req, res) => {
  res.json({
    international: {
      cost: 50,
      currency: "USD",
      estimatedDays: "5-7 business days",
      tracking: true,
      insurance: true,
    },
    policies: {
      returns: "30-day return policy",
      warranty: "Lifetime warranty on craftsmanship",
      packaging: "Luxury gift packaging included",
    },
  });
});

app.get("/api/healthz", (req, res) => {
  res.json({
    status: "ok",
    service: "Verity Gem API",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ERROR HANDLING
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              💎  VERITY GEM  💎                           ║
║          Luxury Jewelry E-Commerce API                   ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  🚀 Server running on port ${PORT}                          ║
║  📧 SendGrid: ${
    process.env.SENDGRID_API_KEY ? "✓ Configured" : "✗ Not configured"
  }                    ║
║  📬 SMTP Backup: ${
    process.env.SMTP_USER ? "✓ Configured" : "✗ Not configured"
  }                 ║
║  💰 Currency API: ${
    process.env.CURRENCY_API_KEY ? "✓ Configured" : "✗ Using free service"
  }      ║
║  🗄️  MongoDB: Connected                                   ║
║                                                           ║
║  Environment: ${
    process.env.NODE_ENV || "development"
  }                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, closing server gracefully...");
  process.exit(0);
});
