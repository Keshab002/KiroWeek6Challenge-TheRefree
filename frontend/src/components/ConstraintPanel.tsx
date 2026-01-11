import { useState } from 'react';
import { AlertCircle, Loader2, Sparkles, Calculator } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { Constraints, Integration, Option } from '@/types';

interface ConstraintPanelProps {
  constraints: Constraints;
  onConstraintsChange: (constraints: Constraints) => void;
  onRunComparison: (useAI: boolean, additionalContext?: string) => void;
  isLoading: boolean;
  availableIntegrations: Integration[];
  availableOptions: Option[];
  selectedOptions: [string, string] | null;
  onSelectedOptionsChange: (options: [string, string]) => void;
  error?: string | null;
}

const SCALABILITY_OPTIONS: Array<{ value: Constraints['scalabilityPriority']; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

/**
 * ConstraintPanel component for configuring comparison constraints.
 * Includes budget range slider, scalability priority buttons, and integration checkboxes.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
export function ConstraintPanel({
  constraints,
  onConstraintsChange,
  onRunComparison,
  isLoading,
  availableIntegrations,
  availableOptions,
  selectedOptions,
  onSelectedOptionsChange,
  error,
}: ConstraintPanelProps) {
  const [additionalContext, setAdditionalContext] = useState('');
  const [useAIMode, setUseAIMode] = useState(true);
  const handleBudgetMinChange = (value: number[]) => {
    const newMin = value[0];
    onConstraintsChange({
      ...constraints,
      budgetMin: newMin,
      // Ensure max is always >= min
      budgetMax: Math.max(constraints.budgetMax, newMin),
    });
  };

  const handleBudgetMaxChange = (value: number[]) => {
    const newMax = value[0];
    onConstraintsChange({
      ...constraints,
      budgetMax: newMax,
      // Ensure min is always <= max
      budgetMin: Math.min(constraints.budgetMin, newMax),
    });
  };

  const handleScalabilityChange = (priority: Constraints['scalabilityPriority']) => {
    onConstraintsChange({
      ...constraints,
      scalabilityPriority: priority,
    });
  };

  const handleIntegrationToggle = (integrationId: string) => {
    const currentIntegrations = constraints.requiredIntegrations;
    const newIntegrations = currentIntegrations.includes(integrationId)
      ? currentIntegrations.filter((id) => id !== integrationId)
      : [...currentIntegrations, integrationId];

    onConstraintsChange({
      ...constraints,
      requiredIntegrations: newIntegrations,
    });
  };

  // Group integrations by category
  const integrationsByCategory = availableIntegrations.reduce<Record<string, Integration[]>>(
    (acc, integration) => {
      const category = integration.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(integration);
      return acc;
    },
    {}
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Constraints</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Option Selection Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Options to Compare</Label>
          
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Option A</Label>
              <select
                value={selectedOptions?.[0] || ''}
                onChange={(e) => {
                  if (selectedOptions) {
                    onSelectedOptionsChange([e.target.value, selectedOptions[1]]);
                  }
                }}
                disabled={isLoading || availableOptions.length === 0}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {availableOptions.map((option) => (
                  <option key={option.id} value={option.id} disabled={option.id === selectedOptions?.[1]}>
                    {option.name} ({option.category})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Option B</Label>
              <select
                value={selectedOptions?.[1] || ''}
                onChange={(e) => {
                  if (selectedOptions) {
                    onSelectedOptionsChange([selectedOptions[0], e.target.value]);
                  }
                }}
                disabled={isLoading || availableOptions.length === 0}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {availableOptions.map((option) => (
                  <option key={option.id} value={option.id} disabled={option.id === selectedOptions?.[0]}>
                    {option.name} ({option.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Budget Range Section */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Budget Range</Label>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minimum</span>
                <span>${constraints.budgetMin.toLocaleString()}</span>
              </div>
              <Slider
                value={[constraints.budgetMin]}
                onValueChange={handleBudgetMinChange}
                min={0}
                max={100000}
                step={1000}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Maximum</span>
                <span>${constraints.budgetMax.toLocaleString()}</span>
              </div>
              <Slider
                value={[constraints.budgetMax]}
                onValueChange={handleBudgetMaxChange}
                min={0}
                max={100000}
                step={1000}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Scalability Priority Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Scalability Priority</Label>
          <div className="flex gap-2">
            {SCALABILITY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={constraints.scalabilityPriority === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleScalabilityChange(option.value)}
                disabled={isLoading}
                className="flex-1 transition-all duration-200"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Required Integrations Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Required Integrations</Label>
          {Object.keys(integrationsByCategory).length === 0 ? (
            <p className="text-xs text-muted-foreground">No integrations available</p>
          ) : (
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
              {Object.entries(integrationsByCategory).map(([category, integrations]) => (
                <div key={category} className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {category}
                  </p>
                  <div className="space-y-2">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={integration.id}
                          checked={constraints.requiredIntegrations.includes(integration.id)}
                          onCheckedChange={() => handleIntegrationToggle(integration.id)}
                          disabled={isLoading}
                        />
                        <Label
                          htmlFor={integration.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {integration.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Context for AI - Only visible in AI mode */}
        {useAIMode && (
          <div className="space-y-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Tell AI About Yourself
            </Label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Examples:
• I'm a beginner developer
• Building a small startup project
• Need something easy to learn
• Budget is limited
• Team of 2-3 developers"
              className="w-full h-24 px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              AI will tailor recommendations based on your experience level and needs
            </p>
          </div>
        )}

        {/* Run Comparison Buttons */}
        <div className="space-y-2">
          {useAIMode ? (
            <Button
              onClick={() => onRunComparison(true, additionalContext)}
              disabled={isLoading}
              className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Compare with AI
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => onRunComparison(false)}
              disabled={isLoading}
              className="w-full gap-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  Run Standard Compare
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={() => setUseAIMode(!useAIMode)}
            variant="ghost"
            size="sm"
            className="w-full text-xs"
          >
            {useAIMode ? (
              <>Switch to Standard Mode (no AI)</>
            ) : (
              <><Sparkles className="h-3 w-3 mr-1" /> Switch to AI Mode</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConstraintPanel;
