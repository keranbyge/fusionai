import type { RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PgSession = connectPg(session);

export function getSessionMiddleware() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  return session({
    store: new PgSession({
      conString: process.env.DATABASE_URL!,
      createTableIfMissing: false, // We created the sessions table in schema
      ttl: sessionTtl / 1000, // Convert to seconds
      tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

// Middleware to check if user is authenticated
export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Extend Express session type
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
