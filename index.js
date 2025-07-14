// index.js

// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000; // Use port 3000 or whatever is available

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Firebase Initialization ---
try {
  // Use the service account path from environment variables
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH not found in .env");
  }

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK initialized successfully!");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error.message);
  process.exit(1); // Exit the process if Firebase initialization fails
}
// --- End Firebase Initialization ---

// --- API Endpoint to Send Notifications ---
app.post("/send-notification", async (req, res) => {
  const { deviceToken, title, body, imageUrl, data } = req.body;

  if (!deviceToken || !title || !body) {
    return res
      .status(400)
      .json({ error: "deviceToken, title, and body are required." });
  }

  const message = {
    notification: {
      title: title,
      body: body,
      ...(imageUrl && { imageUrl: imageUrl }), // Add imageUrl if provided
    },
    token: deviceToken, // The specific device token to send the notification to
    data: data || {}, // Optional: Custom data payload
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    res
      .status(200)
      .json({
        success: true,
        message: "Notification sent successfully!",
        response: response,
      });
  } catch (error) {
    console.error("Error sending message:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Error sending notification.",
        details: error.message,
      });
  }
});

// --- Basic Health Check Endpoint (Optional) ---
app.get("/", (req, res) => {
  res.status(200).send("Firebase Notification Backend is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access backend at http://localhost:${PORT}`);
});
