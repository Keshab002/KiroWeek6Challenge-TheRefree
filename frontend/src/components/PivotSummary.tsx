import { Compass, ArrowRight, Sparkles, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PivotResult, RequestStatus, AIComparisonResult } from '@/types';
import { cn } from '@/lib/utils';

interface PivotSummaryProps {
  pivot: PivotResult | null;
  status: RequestStatus;
  aiAnalysis?: AIComparisonResult | null;
  className?: string;
}

/**
 * PivotSummary component displays the decision pivot statement prominently.
 * Highlights conditional factors and styled as a decision callout.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function PivotSummary({
  pivot,
  status,
  aiAnalysis,
  className,
}: PivotSummaryProps) {
  // Loading state
  if (status === 'loading') {
    return (
      <Card className={cn('bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20', className)}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty/idle state
  if (status === 'idle' || !pivot) {
    return (
      <Card className={cn('border-dashed bg-muted/20', className)}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Decision Summary</p>
              <p className="text-sm">
                Run a comparison to see your personalized decision guidance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse the statement to highlight key parts
  const highlightStatement = (statement: string) => {
    // Try to identify and highlight the conditional parts
    // Pattern: "If X matters more than Y, choose A; otherwise choose B"
    const ifMatch = statement.match(/^If\s+(.+?)\s+matters?\s+more\s+than\s+(.+?),\s+choose\s+(.+?);\s+otherwise\s+choose\s+(.+?)\.?$/i);
    
    if (ifMatch) {
      const [, factor1, factor2, option1, option2] = ifMatch;
      return (
        <span>
          If{' '}
          <span className="font-semibold text-primary">{factor1}</span>
          {' '}matters more than{' '}
          <span className="font-semibold text-primary">{factor2}</span>
          , choose{' '}
          <span className="font-bold text-green-400">{option1}</span>
          ; otherwise choose{' '}
          <span className="font-bold text-blue-400">{option2}</span>
        </span>
      );
    }

    // Fallback: just return the statement with basic highlighting
    return statement;
  };

  return (
    <Card className={cn(
      'bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5',
      'border-primary/30 shadow-lg shadow-primary/5',
      'animate-fade-in transition-all duration-300 hover:shadow-xl hover:shadow-primary/10',
      className
    )}>
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 transition-transform duration-200 hover:scale-110">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Decision Guidance</h3>
              <Badge variant="outline" className="text-xs">
                Based on your constraints
              </Badge>
              {aiAnalysis && (
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                  <Target className="h-3 w-3" />
                  AI Analysis
                </span>
              )}
            </div>

            {/* AI Decision Guidance - Detailed */}
            {aiAnalysis?.decisionGuidance && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {aiAnalysis.decisionGuidance}
                </p>
                {aiAnalysis.recommendation && (
                  <div className="mt-3 pt-3 border-t border-blue-500/20">
                    <p className="text-sm font-medium text-blue-300">
                      💡 Recommendation: <span className="text-muted-foreground font-normal">{aiAnalysis.recommendation}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Main Statement (fallback when no AI) */}
            {!aiAnalysis?.decisionGuidance && (
              <p className="text-base leading-relaxed">
                {highlightStatement(pivot.statement)}
              </p>
            )}

            {/* Factor Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Key factors:</span>
              <Badge variant="secondary" className="text-xs transition-colors duration-200 hover:bg-secondary/80">
                {pivot.primaryFactor}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs transition-colors duration-200 hover:bg-secondary/80">
                {pivot.secondaryFactor}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PivotSummary;
