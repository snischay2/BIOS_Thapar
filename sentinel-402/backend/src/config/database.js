import mongoose from "mongoose";

import {
  SpendCounter,
  PaymentReservation
} from "../models/paymentModels.js";

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (
    !mongoUri ||
    mongoUri.includes("YOUR_MONGODB")
  ) {
    throw new Error(
      "Please configure a valid MONGODB_URI in your .env file"
    );
  }

  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
      retryWrites: true
    });

    // Ensure unique indexes exist before accepting reservations.
    await Promise.all([
      SpendCounter.init(),
      PaymentReservation.init()
    ]);

    console.log("MongoDB connected successfully");
    console.log("TXFORT database indexes initialized");

  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}