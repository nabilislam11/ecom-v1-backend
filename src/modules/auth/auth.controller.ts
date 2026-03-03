import type { Request, Response } from "express";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./auth.schema.js";
import * as AuthService from "./auth.service.js";
import { cookieOptions } from "../../lib/jwt.js";

const isProd = process.env.NODE_ENV === "production";

// Reusable cookie setter
const setCookies = (res: Response, access: string, refresh?: string) => {
  res.cookie("accessToken", access, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "none",
    maxAge: 15 * 60 * 1000, //15 min
  });
  if (refresh) {
    res.cookie("refreshToken", refresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
};

export async function registerHandler(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const user = await AuthService.registerUser(parsed.data);
    return res.status(201).json({ message: "User registered successfully", user });
  } catch (error: any) {
    if (error.message === "EMAIL_IN_USE") {
      return res.status(409).json({ message: "Email already in use" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { user, accessToken, refreshToken } = await AuthService.loginUser(parsed.data);

    // Set cookies using the centralized security options from our lib
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({ message: "Logged in successfully", user });
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    const { accessToken } = await AuthService.refreshSession(refreshToken);
    setCookies(res, accessToken); // Only update the access token

    return res.status(200).json({ message: "Session refreshed" });
  } catch (error) {
    // If refresh token is invalid/expired, clear cookies so the frontend knows to kick them to the login screen
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(401).json({ message: "Session expired" });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    // 1. Safely extract the user ID attached by the requireAuth middleware
    const userId = (req as any).user?.id;

    // Edge Case Check: If middleware failed to attach user, still clear cookies to be safe
    if (userId) {
      // 2. Invalidate the token in the database via the Service layer
      await AuthService.logoutUser(userId);
    }

    // 3. THE LOGOUT FIX: Clear cookies using the EXACT SAME options as login
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({ message: "Logged out successfully across all devices" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error during logout" });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });

    await AuthService.forgotPassword(parsed.data);

    // Always send the exact same success message so hackers can't guess valid emails
    return res.status(200).json({ message: "If an account exists, a reset link has been sent to that email." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });

    await AuthService.resetPassword(parsed.data);

    return res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (error: any) {
    if (error.message === "Invalid or expired reset token") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}
