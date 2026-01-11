import { useState, useCallback } from 'react';
import { compare, getOptions, getIntegrations, getSupportedIntegrations, ApiClientError } from '@/lib/api';
import type {
  Constraints,
  ComparisonResult,
  TradeOffExplanation,
  PivotResult,
  Option,
  Integration,
  RequestStatus,
  AIComparisonResult,
} from '@/types';

interface UseComparisonState {
  comparison: ComparisonResult | null;
  explanation: TradeOffExplanation | null;
  pivot: PivotResult | null;
  status: RequestStatus;
  error: string | null;
  availableOptions: Option[];
  availableIntegrations: Integration[];
  selectedOptions: [string, string] | null;
  aiEnhanced: boolean;
  aiAnalysis: AIComparisonResult | null;
}

const initialState: UseComparisonState = {
  comparison: null,
  explanation: null,
  pivot: null,
  status: 'idle',
  error: null,
  availableOptions: [],
  availableIntegrations: [],
  selectedOptions: null,
  aiEnhanced: false,
  aiAnalysis: null,
};

/**
 * Custom hook for managing comparison API calls and results.
 * Handles loading states, errors, and data fetching.
 * 
 * Requirements: 7.1, 7.4
 */
export function useComparison() {
  const [state, setState] = useState<UseComparisonState>(initialState);

  const setSelectedOptions = useCallback((options: [string, string] | null) => {
    setState((prev) => ({ ...prev, selectedOptions: options }));
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const response = await getOptions();
      setState((prev) => ({
        ...prev,
        availableOptions: response.options,
      }));
      return response.options;
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? `${error.message}. ${error.suggestion}`
          : 'Failed to fetch options';
      setState((prev) => ({ ...prev, error: message }));
      return [];
    }
  }, []);

  const fetchIntegrations = useCallback(async (optionIds?: string[]) => {
    try {
      // If option IDs provided, fetch only supported integrations
      const response = optionIds && optionIds.length > 0
        ? await getSupportedIntegrations(optionIds)
        : await getIntegrations();
      setState((prev) => ({
        ...prev,
        availableIntegrations: response.integrations,
      }));
      return response.integrations;
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? `${error.message}. ${error.suggestion}`
          : 'Failed to fetch integrations';
      setState((prev) => ({ ...prev, error: message }));
      return [];
    }
  }, []);

  const runComparison = useCallback(
    async (constraints: Constraints, optionIds: [string, string], useAI: boolean = false, additionalContext?: string) => {
      setState((prev) => ({
        ...prev,
        status: 'loading',
        error: null,
      }));

      try {
        const response = await compare({
          constraints,
          optionIds,
          additionalContext,
        }, useAI);

        setState((prev) => ({
          ...prev,
          comparison: response.comparison,
          explanation: response.explanation,
          pivot: response.pivot,
          aiEnhanced: response.aiEnhanced || false,
          aiAnalysis: response.aiAnalysis || null,
          status: 'success',
          error: null,
        }));

        return response;
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? `${error.message}. ${error.suggestion}`
            : 'An unexpected error occurred during comparison';

        setState((prev) => ({
          ...prev,
          status: 'error',
          error: message,
        }));

        throw error;
      }
    },
    []
  );

  const clearComparison = useCallback(() => {
    setState((prev) => ({
      ...prev,
      comparison: null,
      explanation: null,
      pivot: null,
      aiEnhanced: false,
      aiAnalysis: null,
      status: 'idle',
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    setSelectedOptions,
    fetchOptions,
    fetchIntegrations,
    runComparison,
    clearComparison,
    clearError,
  };
}

export default useComparison;
