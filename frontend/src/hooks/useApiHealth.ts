import { useState, useEffect, useCallback, useRef } from 'react';
import { checkHealth, ApiClientError } from '@/lib/api';
import type { HealthResponse } from '@/types';

interface UseApiHealthState {
  isHealthy: boolean;
  isChecking: boolean;
  lastCheck: Date | null;
  healthData: HealthResponse | null;
  error: string | null;
}

const initialState: UseApiHealthState = {
  isHealthy: false,
  isChecking: true,
  lastCheck: null,
  healthData: null,
  error: null,
};

/**
 * Custom hook for checking API health on load and providing retry functionality.
 * 
 * Requirements: 7.1, 7.4
 */
export function useApiHealth(checkOnMount = true) {
  const [state, setState] = useState<UseApiHealthState>(initialState);
  const hasCheckedRef = useRef(false);

  const performHealthCheck = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isChecking: true,
      error: null,
    }));

    try {
      const response = await checkHealth();
      const isHealthy = response.status === 'healthy' && response.database === 'connected';

      setState({
        isHealthy,
        isChecking: false,
        lastCheck: new Date(),
        healthData: response,
        error: isHealthy ? null : 'API is available but not fully healthy',
      });

      return isHealthy;
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? `${error.message}. ${error.suggestion}`
          : 'Unable to connect to the API server';

      setState({
        isHealthy: false,
        isChecking: false,
        lastCheck: new Date(),
        healthData: null,
        error: message,
      });

      return false;
    }
  }, []);

  const retry = useCallback(() => {
    return performHealthCheck();
  }, [performHealthCheck]);

  useEffect(() => {
    if (checkOnMount && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      const runCheck = async () => {
        await performHealthCheck();
      };
      runCheck();
    }
  }, [checkOnMount, performHealthCheck]);

  return {
    ...state,
    retry,
    performHealthCheck,
  };
}

export default useApiHealth;
