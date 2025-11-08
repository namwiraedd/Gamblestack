import { Pool } from "pg";
import { Request, Response, NextFunction } from "express";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function requireRole(roleName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization?.replace("Bearer ","");
    if (!auth) return res.status(401).end();
    // decode token to get user id (use jose verify earlier)
    // simplified: assume req.user set by auth middleware
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).end();
    const r = await pool.query("SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id=r.id WHERE ur.user_id=$1 AND r.name=$2", [userId, roleName]);
    if (r.rowCount === 0) return res.status(403).json({ error: "forbidden" });
    return next();
  };
}
