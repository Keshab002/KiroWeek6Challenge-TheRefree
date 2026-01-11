import type {
  ApiError,
  CompareRequest,
  CompareResponse,
  HealthResponse,
  IntegrationsResponse,
  OptionsResponse,
} from '@/types';
import {
  validateCompareResponse,
  validateHealthResponse,
  validateOptionsResponse,
  validateIntegrationsResponse,
  ValidationError,
} from './validation';

// API base URL from environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Log API configuration in development
if (import.meta.env.DEV) {
  if (!import.meta.env.VITE_API_BASE_URL) {
    console.warn(
      '[API] VITE_API_BASE_URL not set, using default: http://localhost:3000/api\n' +
      'Set VITE_API_BASE_URL in .env file for custom configuration.'
    );
  } else {
    console.log(`[API] Using API base URL: ${API_BASE_URL}`);
  }
}

// Error messages with suggestions
const ERROR_MESSAGES: Record<string, ApiError> = {
  NETWORK_ERROR: {
    message: 'Unable to connect to the server',
    code: 'NETWORK_ERROR',
    suggestion: 'Check your internet connection and try again',
  },
  API_UNAVAILABLE: {
    message: 'The comparison service is currently unavailable',
    code: 'API_UNAVAILABLE',
    suggestion: 'Please try again in a few moments',
  },
  INVALID_RESPONSE: {
    message: 'Received unexpected data from the server',
    code: 'INVALID_RESPONSE',
    suggestion: 'Please refresh the page and try again',
  },
  VALIDATION_ERROR: {
    message: 'Invalid input provided',
    code: 'VALIDATION_ERROR',
    suggestion: 'Please check your constraint values and try again',
  },
  SERVER_ERROR: {
    message: 'An unexpected server error occurred',
    code: 'SERVER_ERROR',
    suggestion: 'Please try again later or contact support',
  },
  PARSE_ERROR: {
    message: 'Failed to parse server response',
    code: 'PARSE_ERROR',
    suggestion: 'Please refresh the page and try again',
  },
};

// Custom error class for API errors
export class ApiClientError extends Error {
  code: string;
  suggestion: string;
  statusCode?: number;

  constructor(apiError: ApiError, statusCode?: number) {
    super(apiError.message);
    this.name = 'ApiClientError';
    this.code = apiError.code;
    this.suggestion = apiError.suggestion;
    this.statusCode = statusCode;
  }
}

// Generic fetch wrapper with error handling
async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit,
  validator?: (data: unknown) => T
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 400) {
        // Try to get validation error details from response
        try {
          const errorData = await response.json();
          throw new ApiClientError(
            {
              message: errorData.error || ERROR_MESSAGES.VALIDATION_ERROR.message,
              code: errorData.code || 'VALIDATION_ERROR',
              suggestion: ERROR_MESSAGES.VALIDATION_ERROR.suggestion,
            },
            response.status
          );
        } catch (e) {
          if (e instanceof ApiClientError) throw e;
          throw new ApiClientError(ERROR_MESSAGES.VALIDATION_ERROR, response.status);
        }
      }

      if (response.status === 503) {
        throw new ApiClientError(ERROR_MESSAGES.API_UNAVAILABLE, response.status);
      }

      if (response.status >= 500) {
        throw new ApiClientError(ERROR_MESSAGES.SERVER_ERROR, response.status);
      }

      throw new ApiClientError(ERROR_MESSAGES.API_UNAVAILABLE, response.status);
    }

    // Parse JSON response
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ApiClientError(ERROR_MESSAGES.PARSE_ERROR);
    }

    // Validate response if validator provided
    if (validator) {
      try {
        return validator(data);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ApiClientError({
            message: `${ERROR_MESSAGES.INVALID_RESPONSE.message}: ${error.message}`,
            code: 'INVALID_RESPONSE',
            suggestion: ERROR_MESSAGES.INVALID_RESPONSE.suggestion,
          });
        }
        throw new ApiClientError(ERROR_MESSAGES.INVALID_RESPONSE);
      }
    }

    return data as T;
  } catch (error) {
    // Re-throw ApiClientError as-is
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiClientError(ERROR_MESSAGES.NETWORK_ERROR);
    }

    // Handle other errors
    throw new ApiClientError(ERROR_MESSAGES.NETWORK_ERROR);
  }
}

// API client functions

/**
 * Check API health status
 */
export async function checkHealth(): Promise<HealthResponse> {
  return fetchWithErrorHandling<HealthResponse>(
    `${API_BASE_URL}/health`,
    undefined,
    validateHealthResponse
  );
}

/**
 * Get all available options for comparison
 */
export async function getOptions(): Promise<OptionsResponse> {
  return fetchWithErrorHandling<OptionsResponse>(
    `${API_BASE_URL}/options`,
    undefined,
    validateOptionsResponse
  );
}

/**
 * Get all available integrations
 */
export async function getIntegrations(): Promise<IntegrationsResponse> {
  return fetchWithErrorHandling<IntegrationsResponse>(
    `${API_BASE_URL}/options/integrations`,
    undefined,
    validateIntegrationsResponse
  );
}

/**
 * Get integrations supported by specific options
 * @param optionIds - Array of option IDs to check
 */
export async function getSupportedIntegrations(optionIds: string[]): Promise<IntegrationsResponse> {
  const url = optionIds.length > 0 
    ? `${API_BASE_URL}/options/supported-integrations?optionIds=${optionIds.join(',')}`
    : `${API_BASE_URL}/options/integrations`;
  return fetchWithErrorHandling<IntegrationsResponse>(
    url,
    undefined,
    validateIntegrationsResponse
  );
}

export interface CompareRequestWithContext extends CompareRequest {
  additionalContext?: string;
}

/**
 * Run a comparison between two options with given constraints
 * @param request - The comparison request
 * @param useAI - If true, use full AI comparison mode
 */
export async function compare(request: CompareRequestWithContext, useAI: boolean = false): Promise<CompareResponse> {
  const url = useAI ? `${API_BASE_URL}/compare?useAI=true` : `${API_BASE_URL}/compare`;
  return fetchWithErrorHandling<CompareResponse>(
    url,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    validateCompareResponse
  );
}

// Export error messages for use in components
export { ERROR_MESSAGES };
