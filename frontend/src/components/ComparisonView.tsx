import { AlertCircle, ArrowRight, Scale, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState, LoadingCard } from '@/components/LoadingState';
import { OptionCard } from '@/components/OptionCard';
import type { ComparisonResult, RequestStatus, AIComparisonResult } from '@/types';
import { cn } from '@/lib/utils';

interface ComparisonViewProps {
  comparison: ComparisonResult | null;
  status: RequestStatus;
  error: string | null;
  aiEnhanced?: boolean;
  aiAnalysis?: AIComparisonResult | null;
  className?: string;
}

/**
 * ComparisonView component displays two options side-by-side.
 * Handles loading, empty, and error states appropriately.
 * 
 * Requirements: 2.1, 2.6, 2.7, 2.8
 */
export function ComparisonView({
  comparison,
  status,
  error,
  aiEnhanced,
  aiAnalysis,
  className,
}: ComparisonViewProps) {
  // Loading state
  if (status === 'loading') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-center py-4">
          <LoadingState message="Running comparison..." size="md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LoadingCard title="Option A" />
          <LoadingCard title="Option B" />
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error' && error) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Comparison Failed</AlertTitle>
            <AlertDescription>
              {error}
              <p className="mt-2 text-xs">
                Please check your constraints and try again. If the problem persists, 
                verify the API connection.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty/idle state - no comparison run yet
  if (status === 'idle' || !comparison) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Scale className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Comparison Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Configure your constraints in the panel on the left, then click 
            "Run Comparison" to see a side-by-side analysis of your options.
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Set constraints</span>
            <ArrowRight className="h-3 w-3" />
            <span>Run comparison</span>
            <ArrowRight className="h-3 w-3" />
            <span>View results</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate comparison data
  if (!comparison.options || comparison.options.length !== 2) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Data</AlertTitle>
            <AlertDescription>
              The comparison data received from the server is malformed or incomplete.
              Expected exactly 2 options but received {comparison.options?.length ?? 0}.
              <p className="mt-2 text-xs">
                Please try running the comparison again. If this persists, contact support.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Success state - display comparison
  const [optionA, optionB] = comparison.options;

  return (
    <div className={cn('space-y-4 animate-fade-in', className)}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Side-by-Side Comparison
            {aiEnhanced && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="h-3 w-3" />
                AI Enhanced
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {aiAnalysis && (
          <CardContent className="pt-0 space-y-3">
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <p className="text-sm font-medium text-purple-300 mb-1">
                🤖 AI Recommendation
              </p>
              <p className="text-sm text-muted-foreground">
                {aiAnalysis.recommendation}
              </p>
              {aiAnalysis.confidenceScore && (
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {aiAnalysis.confidenceScore}%
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-stagger">
        <OptionCard 
          option={optionA} 
          aiAnalysis={aiAnalysis?.detailedAnalysis?.find(a => a.optionName === optionA.name)}
          className="hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5" 
        />
        <OptionCard 
          option={optionB} 
          aiAnalysis={aiAnalysis?.detailedAnalysis?.find(a => a.optionName === optionB.name)}
          className="hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5" 
        />
      </div>
    </div>
  );
}

export default ComparisonView;
