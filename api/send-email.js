import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

const ADMIN_UID = "jUVRPKVD9VWGk0guVbDT68FTgxj1";

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function hasFirebaseAdminCredentials() {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
    (process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY)
  );
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Approach 1: Use base64-encoded service account JSON (recommended for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
      const serviceAccount = JSON.parse(decoded);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:", e.message);
    }
  }

  // Approach 2: Use individual env vars as fallback
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw createHttpError(
      "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
      500,
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function verifyAdminRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    // No token provided; in development allow request
    return {};
  }
  const idToken = authHeader.slice("Bearer ".length);
  // If Firebase credentials are not set, skip verification
  if (!hasFirebaseAdminCredentials()) {
    console.warn("Firebase admin credentials missing; skipping token verification.");
    return {};
  }
  const auth = getAuth(getAdminApp());
  const decodedToken = await auth.verifyIdToken(idToken);
  if (decodedToken.uid !== ADMIN_UID) {
    throw createHttpError("You are not allowed to send admin emails.", 403);
  }
  return decodedToken;
}



async function getRecipients(target, recipientIds) {
  // Fallback: if Firebase credentials are missing, use admin Gmail as sole recipient
  if (!hasFirebaseAdminCredentials()) {
    console.warn("Firebase credentials missing; using fallback recipient list.");
    return [process.env.GMAIL_USER];
  }

  const db = getFirestore(getAdminApp());

  if (target === "all") {
    const snapshot = await db.collection("users").get();
    return snapshot.docs
      .map((doc) => doc.data())
      .filter((user) => user?.email && !user?.isDisabled)
      .map((user) => user.email);
  }

  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return [];
  }

  const userDocs = await Promise.all(
    recipientIds.map((userId) => db.collection("users").doc(userId).get()),
  );

  return userDocs
    .filter((doc) => doc.exists)
    .map((doc) => doc.data())
    .filter((user) => user?.email)
    .map((user) => user.email);
}


export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    await verifyAdminRequest(req);

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};
    const target = body?.target === "selected" ? "selected" : "all";
    const recipientIds = Array.isArray(body?.recipientIds)
      ? body.recipientIds
      : [];
    const subject = String(body?.subject || "").trim();
    const message = String(body?.message || "").trim();

    if (!subject || !message) {
      return res
        .status(400)
        .json({ error: "Subject and message are required." });
    }

    const recipients = await getRecipients(target, recipientIds);

    if (recipients.length === 0) {
      return res.status(400).json({ error: "No valid recipients found." });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
      return res.status(500).json({
        error: "Missing GMAIL_USER or GMAIL_APP_PASS environment variables.",
      });
    }

    const htmlMessage = escapeHtml(message).replace(/\n/g, "<br />");
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 16px;">${escapeHtml(subject)}</h2>
        <div style="white-space: normal;">${htmlMessage}</div>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    const mailOptions = {
      from: `"Alex Stories" <${process.env.GMAIL_USER}>`,
      to: recipients.length === 1 ? recipients[0] : process.env.GMAIL_USER,
      subject,
      html,
      text: message,
    };

    if (recipients.length > 1) {
      mailOptions.bcc = recipients;
    }

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      ok: true,
      sentCount: recipients.length,
    });
  } catch (error) {
    console.error("Send email handler error:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Unable to send email.",
    });
  }
}
