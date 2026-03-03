import jwt from "jsonwebtoken";

// Adjust these to match your actual env variables
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export interface JwtPayload {
  sub: string;
  role: string;
  tokenVersion: number;
}

// 🚨 THE MAGIC FIX: Centralized cookie options so Login and Logout always match!
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  // Note: If you use a specific 'domain' in production, you must add it here too!
};

export function generateTokens(user: { _id: any; role: string; tokenVersion: number }) {
  const accessToken = jwt.sign(
    { sub: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion },
    ACCESS_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign({ sub: user._id.toString(), tokenVersion: user.tokenVersion }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}
