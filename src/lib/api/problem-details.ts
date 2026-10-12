export class ApiError extends Error {
  public status: number;
  public title: string;
  public detail: string;
  public instance?: string;
  public correlationId?: string;

  constructor(status: number, title: string, detail: string, instance?: string, correlationId?: string) {
    super(`${status} ${title}: ${detail}`);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.instance = instance;
    this.correlationId = correlationId;
  }
}

export class ValidationApiError extends ApiError {
  public errors: Record<string, string[]>;

  constructor(status: number, title: string, detail: string, errors: Record<string, string[]>, instance?: string, correlationId?: string) {
    super(status, title, detail, instance, correlationId);
    this.name = 'ValidationApiError';
    this.errors = errors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(detail = 'Not authenticated. Please log in.', instance?: string, correlationId?: string) {
    super(401, 'Unauthorized', detail, instance, correlationId);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(detail = 'You do not have permission to perform this action.', instance?: string, correlationId?: string) {
    super(403, 'Forbidden', detail, instance, correlationId);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(detail = 'The requested resource was not found.', instance?: string, correlationId?: string) {
    super(404, 'Not Found', detail, instance, correlationId);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(detail = 'A conflict occurred with the current state of the resource.', instance?: string, correlationId?: string) {
    super(409, 'Conflict', detail, instance, correlationId);
    this.name = 'ConflictError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network unavailable. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Parses response body into the most specific ApiError subclass possible.
 */
export function parseProblemDetails(status: number, body: any): ApiError {
  const title = body?.title || 'API Error';
  const detail = body?.detail || 'An unexpected error occurred.';
  const instance = body?.instance;
  const correlationId = body?.traceId || body?.correlationId;

  if (status === 401) {
    return new AuthenticationError(detail, instance, correlationId);
  }
  if (status === 403) {
    return new AuthorizationError(detail, instance, correlationId);
  }
  if (status === 404) {
    return new NotFoundError(detail, instance, correlationId);
  }
  if (status === 409) {
    return new ConflictError(detail, instance, correlationId);
  }

  // Handle Validation Errors
  if (status === 400 || status === 422) {
    if (body?.errors && typeof body.errors === 'object') {
      return new ValidationApiError(
        status,
        title,
        detail,
        body.errors as Record<string, string[]>,
        instance,
        correlationId
      );
    }
  }

  return new ApiError(status, title, detail, instance, correlationId);
}
