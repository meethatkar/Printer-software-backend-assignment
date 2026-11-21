/**
-- ==============================================================================
-- EXPRESS AUTHENTICATION & RBAC MIDDLEWARES
-- Standard Express middleware signatures: (req, res, next)
-- ==============================================================================
*/

import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../configs/supabase';
import { getEnv } from '../configs/env';
import { getProfileById } from '../tables/profiles';
import { UserRole } from '../types/database.types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  company_name: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Extracts bearer token from Authorization header or cookie
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/sb-access-token=([^;]+)/) ||
                cookieHeader.match(/sb-[^;]+-auth-token=([^;]+)/);
  if (match) {
    try {
      const decoded = decodeURIComponent(match[1]);
      if (decoded.startsWith('[') || decoded.startsWith('{')) {
        const parsed = JSON.parse(decoded);
        return Array.isArray(parsed) ? parsed[0] : parsed.access_token || parsed;
      }
      return decoded;
    } catch {
      return match[1];
    }
  }

  return null;
}

/**
 * Resolves user from token or dev header
 */
export async function resolveUser(req: Request): Promise<AuthenticatedUser | null> {
  const token = extractToken(req);

  // Development/Testing fallback header
  const devUserId = (req.headers['x-user-id'] || req.headers['x-test-user-id']) as string | undefined;
  if (devUserId && getEnv().NODE_ENV !== 'production' && !token) {
    const profile = await getProfileById(devUserId);
    if (profile) {
      return {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        company_name: profile.company_name,
      };
    }
  }

  if (!token) return null;

  try {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const profile = await getProfileById(user.id);
    return {
      id: user.id,
      email: user.email || profile?.email || '',
      role: profile?.role || 'customer',
      full_name: profile?.full_name || user.user_metadata?.full_name || null,
      company_name: profile?.company_name || user.user_metadata?.company_name || null,
    };
  } catch (err) {
    console.error('[Auth Middleware] Verification failed:', err);
    return null;
  }
}

/**
 * Express Middleware: requireAuth
 * Blocks unauthenticated requests with 401 Unauthorized.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await resolveUser(req);
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Valid authentication credentials are required.',
    });
    return;
  }
  req.user = user;
  next();
}

/**
 * Express Middleware: requireRole(role)
 * Restricts access to a specific role (e.g. 'admin' or 'customer').
 */
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication credentials are required.',
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Access requires '${role}' role privilege.`,
      });
      return;
    }

    next();
  };
}

/**
 * Express Middleware: requireAdmin
 * Blocks non-admin requests with 403 Forbidden.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Administrative privileges required.',
    });
    return;
  }

  next();
}

/**
 * Express Middleware: optionalAuth
 * Attaches user if present, otherwise continues as guest.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await resolveUser(req);
  if (user) req.user = user;
  next();
}
