import { CheckCircle2, XCircle, Info, TrendingUp, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/LoadingState';
import type { TradeOffExplanation, OptionAnalysis, RequestStatus } from '@/types';
import { cn } from '@/lib/utils';

interface TradeOffPanelProps {
  explanation: TradeOffExplanation | null;
  status: RequestStatus;
  className?: string;
}

interface OptionAnalysisCardProps {
  analysis: OptionAnalysis;
}

function FitScoreBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const getColorClass = () => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Fit Score</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getColorClass())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function OptionAnalysisCard({ analysis }: OptionAnalysisCardProps) {
  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border transition-all duration-200 hover:bg-muted/40 hover:border-primary/30">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{analysis.optionName}</h4>
        <Badge variant="outline" className="text-xs">
          {Math.round(analysis.fitScore * 100)}% fit
        </Badge>
      </div>

      <FitScoreBar score={analysis.fitScore} />

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Strengths
          </p>
          <ul className="space-y-1">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-green-400 flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            Weaknesses
          </p>
          <ul className="space-y-1">
            {analysis.weaknesses.map((weakness, index) => (
              <li key={index} className="text-sm text-red-400 flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fit Reason */}
      {analysis.fitReason && (
        <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
          {analysis.fitReason}
        </p>
      )}
    </div>
  );
}

/**
 * TradeOffPanel component displays trade-off explanations and analysis.
 * Shows strengths/weaknesses for each option with fit score visualization.
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */
export function TradeOffPanel({
  explanation,
  status,
  className,
}: TradeOffPanelProps) {
  // Loading state
  if (status === 'loading') {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trade-Off Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoadingSkeleton lines={3} />
          <div className="space-y-3">
            <LoadingSkeleton lines={4} />
            <LoadingSkeleton lines={4} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty/idle state - guidance for users
  if (status === 'idle' || !explanation) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trade-Off Analysis
          </CardTitle>
          <CardDescription>
            Understand the trade-offs between options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground mb-3" />
            <h4 className="font-medium mb-2">How to Use</h4>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                Set your budget range based on your project constraints
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                Choose your scalability priority (Low, Medium, or High)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                Select any required integrations
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                Click "Run Comparison" to see the analysis
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full animate-fade-in', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trade-Off Analysis
        </CardTitle>
        <CardDescription>
          Based on your current constraints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary (fallback when no AI) */}
        {explanation.summary && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 transition-all duration-200 hover:bg-primary/10">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{explanation.summary}</p>
            </div>
          </div>
        )}

        {/* Option Analysis */}
        <div className="space-y-3 animate-fade-in-stagger">
          {explanation.optionAnalysis.map((analysis) => (
            <OptionAnalysisCard key={analysis.optionId} analysis={analysis} />
          ))}
        </div>

        {/* Constraint Impact */}
        {explanation.constraintImpact && explanation.constraintImpact.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Constraint Impact
            </p>
            <div className="space-y-1">
              {explanation.constraintImpact.map((impact, index) => (
                <div key={index} className="text-xs">
                  <span className="font-medium">{impact.constraint}:</span>{' '}
                  <span className="text-muted-foreground">{impact.impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TradeOffPanel;
