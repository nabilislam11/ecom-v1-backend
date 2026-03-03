import type { Request, Response, NextFunction } from "express";

// We pass in the allowed role(s) when we call the middleware in the router
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Grab the user object that requireAuth attached to the request
    const user = (req as any).user;

    // 2. Safety check: Ensure requireAuth actually ran first
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // 3. Normalize the allowedRoles input so it's always an array
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // 4. Check if the user's role is in the allowed list
    if (!rolesArray.includes(user.role)) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to perform this action",
      });
    }

    // 5. If they have the correct role, let them through!
    next();
  };
};
