import { describe, it, expect } from 'vitest';
import { 
  parseProblemDetails, 
  ApiError, 
  ValidationApiError, 
  AuthenticationError, 
  NotFoundError, 
  ConflictError 
} from './problem-details';

describe('ProblemDetails Parsing', () => {
  it('should map 401 to AuthenticationError', () => {
    const error = parseProblemDetails(401, { detail: 'Please log in' });
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.status).toBe(401);
    expect(error.detail).toBe('Please log in');
  });

  it('should map 404 to NotFoundError', () => {
    const error = parseProblemDetails(404, { detail: 'Head not found' });
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.status).toBe(404);
  });

  it('should map 409 to ConflictError', () => {
    const error = parseProblemDetails(409, { detail: 'Version mismatch' });
    expect(error).toBeInstanceOf(ConflictError);
  });

  it('should map 400 with errors object to ValidationApiError', () => {
    const payload = {
      title: 'Validation Failed',
      detail: 'Invalid parameters',
      errors: {
        page: ['The page field must be positive']
      },
      traceId: 'trace-12345'
    };
    const error = parseProblemDetails(400, payload);
    expect(error).toBeInstanceOf(ValidationApiError);
    expect(error.status).toBe(400);
    expect((error as ValidationApiError).errors.page[0]).toBe('The page field must be positive');
    expect(error.correlationId).toBe('trace-12345');
  });

  it('should fall back to generic ApiError for other status codes', () => {
    const error = parseProblemDetails(500, { title: 'Server Error', detail: 'Something broke' });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.title).toBe('Server Error');
  });
});
