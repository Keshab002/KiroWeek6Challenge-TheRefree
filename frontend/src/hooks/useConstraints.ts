import { useState, useCallback } from 'react';
import type { Constraints } from '@/types';

const DEFAULT_CONSTRAINTS: Constraints = {
  budgetMin: 0,
  budgetMax: 50000,
  scalabilityPriority: 'medium',
  requiredIntegrations: [],
};

/**
 * Custom hook for managing constraint state.
 * Provides constraint values and update functions without page reload.
 * 
 * Requirements: 1.4
 */
export function useConstraints(initialConstraints?: Partial<Constraints>) {
  const [constraints, setConstraints] = useState<Constraints>({
    ...DEFAULT_CONSTRAINTS,
    ...initialConstraints,
  });

  const updateConstraints = useCallback((newConstraints: Constraints) => {
    setConstraints(newConstraints);
  }, []);

  const updateBudgetMin = useCallback((value: number) => {
    setConstraints((prev) => ({
      ...prev,
      budgetMin: value,
      budgetMax: Math.max(prev.budgetMax, value),
    }));
  }, []);

  const updateBudgetMax = useCallback((value: number) => {
    setConstraints((prev) => ({
      ...prev,
      budgetMax: value,
      budgetMin: Math.min(prev.budgetMin, value),
    }));
  }, []);

  const updateScalabilityPriority = useCallback(
    (priority: Constraints['scalabilityPriority']) => {
      setConstraints((prev) => ({
        ...prev,
        scalabilityPriority: priority,
      }));
    },
    []
  );

  const toggleIntegration = useCallback((integrationId: string) => {
    setConstraints((prev) => {
      const currentIntegrations = prev.requiredIntegrations;
      const newIntegrations = currentIntegrations.includes(integrationId)
        ? currentIntegrations.filter((id) => id !== integrationId)
        : [...currentIntegrations, integrationId];
      return {
        ...prev,
        requiredIntegrations: newIntegrations,
      };
    });
  }, []);

  const resetConstraints = useCallback(() => {
    setConstraints(DEFAULT_CONSTRAINTS);
  }, []);

  return {
    constraints,
    updateConstraints,
    updateBudgetMin,
    updateBudgetMax,
    updateScalabilityPriority,
    toggleIntegration,
    resetConstraints,
  };
}

export default useConstraints;
