/**
-- ==============================================================================
-- STANDARDIZED API RESPONSE HELPERS
-- ==============================================================================
*/

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: Record<string, unknown>;
}

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, status = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function apiError(message: string, status = 400, details?: unknown): Response {
  const body: ApiResponse = {
    success: false,
    error: message,
    ...(details !== undefined ? { details } : {}),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function apiUnauthorized(message = 'Unauthorized'): Response {
  return apiError(message, 401);
}

export function apiNotFound(message = 'Resource not found'): Response {
  return apiError(message, 404);
}

export function apiServerError(message = 'Internal server error', details?: unknown): Response {
  return apiError(message, 500, details);
}

