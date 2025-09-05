/**
 * Standardized API Response Types and Utilities
 * Provides consistent response formatting across all API endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

/**
 * Creates a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: Partial<ApiResponse['meta']>
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      ...meta,
    },
  };
}

/**
 * Creates an error API response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  statusCode: number = 500
): { response: ApiResponse; statusCode: number } {
  return {
    response: {
      success: false,
      error: { code, message, details },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    statusCode,
  };
}

/**
 * Common error codes and messages
 */
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Gmail integration errors
  GMAIL_NOT_CONNECTED: 'GMAIL_NOT_CONNECTED',
  GMAIL_AUTH_FAILED: 'GMAIL_AUTH_FAILED',
  GMAIL_API_ERROR: 'GMAIL_API_ERROR',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Helper function to handle API errors consistently
 */
export function handleApiError(
  error: any,
  defaultCode: string = ERROR_CODES.INTERNAL_ERROR,
  defaultMessage: string = 'An unexpected error occurred'
): { response: ApiResponse; statusCode: number } {
  console.error('API Error:', error);

  // Handle known error types
  if (error?.code === 'PGRST116') {
    return createErrorResponse(
      ERROR_CODES.RECORD_NOT_FOUND,
      'Record not found',
      error.details,
      404
    );
  }

  if (error?.message?.includes('JWT') || error?.message?.includes('token')) {
    return createErrorResponse(
      ERROR_CODES.INVALID_TOKEN,
      'Invalid or expired authentication token',
      error.message,
      401
    );
  }

  if (error?.message?.includes('connect') || error?.message?.includes('timeout')) {
    return createErrorResponse(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'Service temporarily unavailable',
      error.message,
      503
    );
  }

  // Default error response
  return createErrorResponse(
    defaultCode,
    error?.message || defaultMessage,
    process.env.NODE_ENV === 'development' ? error : undefined,
    500
  );
}

/**
 * Type guard to check if response is an API error
 */
export function isApiError(response: ApiResponse): response is ApiResponse & { error: ApiError } {
  return !response.success && !!response.error;
}

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.success && !!response.data;
}