import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 5000;

try {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("SENTINEL 402 BACKEND");
    console.log("MongoDB: Connected");
    console.log(`Port: ${PORT}`);
    console.log("--------------------------------");
  });

} catch (error) {
  console.error(
    "Backend startup failed:",
    error.message
  );

  process.exit(1);
}