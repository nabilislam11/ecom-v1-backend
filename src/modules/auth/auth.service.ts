import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { ForgotPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO } from "./auth.schema.js";
import { User } from "../user/user.model.js";
import { getPasswordResetTemplate } from "../../templates/auth.templates.js";
import { emailQueue } from "../../config/queue.js";

// Helper function to generate tokens
const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, tokenVersion: user.tokenVersion },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { sub: user.id, tokenVersion: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

export async function registerUser(data: RegisterDTO) {
  const email = data.email.toLowerCase().trim();

  const hashedPassword = await bcrypt.hash(data.password, 10); // Lowered to 10 for better concurrency!

  try {
    const user = await User.create({
      email,
      password: hashedPassword,
      ...(data.name ? { name: data.name } : {}),
    });

    return { user, ...generateTokens(user) };
  } catch (error: any) {
    // 11000 is the official MongoDB code for "Duplicate Key"
    if (error.code === 11000) {
      throw new Error("Email already in use");
    }
    throw error;
  }
}

export async function loginUser(data: LoginDTO) {
  const email = data.email.toLowerCase().trim();

  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  return { user, ...generateTokens(user) };
}

export async function refreshSession(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as any;

  const user = await User.findById(decoded.sub);
  if (!user) throw new Error("User not found");

  if (user.tokenVersion !== decoded.tokenVersion) {
    throw new Error("Session expired. Please log in again.");
  }

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, tokenVersion: user.tokenVersion },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: "15m" },
  );

  return { accessToken };
}

export async function forgotPassword(data: ForgotPasswordDTO) {
  const user = await User.findOne({ email: data.email });

  // SECURITY MEASURE: Silently return if user doesn't exist
  if (!user) return;

  // 1. Generate a random 32-character hex string for the email link
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 2. Hash that token before saving it to the database
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  // 3. Save the hashed token and set it to expire in 15 minutes
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  // 4. Generate the frontend link and HTML template
  const resetLink = `https://localhost:4200/api/auth/reset-password?token=${resetToken}`;
  const emailHtml = getPasswordResetTemplate(resetLink);

  // 5. 🚀 DROP IT IN THE QUEUE!
  await emailQueue.add(
    "send-forgot-password",
    {
      type: "PASSWORD_RESET",
      to: user.email,
      subject: "Reset Your Password",
      html: emailHtml,
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  );

  console.log(`📝 Redis Task Queued: Password Reset Email for ${user.email}`);
}

export async function resetPassword(data: ResetPasswordDTO) {
  // 1. Hash the incoming token so we can compare it to the one in the DB
  const hashedToken = crypto.createHash("sha256").update(data.token).digest("hex");

  // 2. Find the user with this token, ensuring it hasn't expired yet
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("Invalid or expired reset token");

  // 3. Hash the new password and update the user
  const hashedPassword = await bcrypt.hash(data.newPassword, 10);
  user.password = hashedPassword;

  // 4. Clean up the database fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // 5. CRITICAL: Increment token version! Instantly logs out old sessions.
  user.tokenVersion += 1;

  await user.save();
  console.log(`✅ Password successfully changed for ${user.email}`);
}

export async function logoutUser(userId: string) {
  // Increments the token version, instantly invalidating all currently issued JWTs
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}
