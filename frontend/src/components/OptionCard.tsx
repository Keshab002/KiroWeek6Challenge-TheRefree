import {
  DollarSign,
  TrendingUp,
  Settings,
  Wrench,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttributeValue, OptionComparison, AIDetailedAnalysis } from '@/types';
import { cn } from '@/lib/utils';

interface OptionCardProps {
  option: OptionComparison;
  aiAnalysis?: AIDetailedAnalysis;
  className?: string;
}

// Map attribute types to icons
const ATTRIBUTE_ICONS: Record<string, LucideIcon> = {
  costModel: DollarSign,
  scalability: TrendingUp,
  complexity: Settings,
  maintenance: Wrench,
};

// Map attribute types to display labels
const ATTRIBUTE_LABELS: Record<string, string> = {
  costModel: 'Cost Model',
  scalability: 'Scalability',
  complexity: 'Complexity',
  maintenance: 'Maintenance',
};

// Map ratings to badge variants and colors
const RATING_STYLES: Record<AttributeValue['rating'], {
  variant: 'destructive' | 'warning' | 'success';
  bgClass: string;
  textClass: string;
}> = {
  low: {
    variant: 'destructive',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
  },
  medium: {
    variant: 'warning',
    bgClass: 'bg-yellow-500/10',
    textClass: 'text-yellow-400',
  },
  high: {
    variant: 'success',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-400',
  },
};

interface AttributeRowProps {
  type: string;
  attribute: AttributeValue;
}

function AttributeRow({ type, attribute }: AttributeRowProps) {
  const Icon = ATTRIBUTE_ICONS[type] || Settings;
  const label = ATTRIBUTE_LABELS[type] || type;
  const ratingStyle = RATING_STYLES[attribute.rating];

  return (
    <div className={cn(
      'flex items-center gap-2 break-all p-3 rounded-lg transition-all duration-200',
      'hover:scale-[1.02] hover:shadow-sm',
      ratingStyle.bgClass
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4 transition-colors duration-200', ratingStyle.textClass)} />
        <span className="text-sm font-medium w-12">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-20 break-word">{attribute.value}</span>
        <Badge variant={ratingStyle.variant} className="capitalize text-xs">
          {attribute.rating}
        </Badge>
      </div>
    </div>
  );
}

/**
 * OptionCard component displays a single option with all its attributes.
 * Uses visual indicators (icons, badges, colors) based on rating values.
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5, 8.5
 */
export function OptionCard({ option, aiAnalysis, className }: OptionCardProps) {
  const { name, description, attributes, score } = option;

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{name}</CardTitle>
            <CardDescription className="text-sm w-35">{description}</CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Fit Score</span>
            <span className="text-2xl font-bold text-primary">
              {Math.round(score * 100)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <AttributeRow type="costModel" attribute={attributes.costModel} />
        <AttributeRow type="scalability" attribute={attributes.scalability} />
        <AttributeRow type="complexity" attribute={attributes.complexity} />
        <AttributeRow type="maintenance" attribute={attributes.maintenance} />
        
        {/* AI Analysis Section */}
        {aiAnalysis && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
            {/* Pros */}
            {aiAnalysis.pros && aiAnalysis.pros.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-400 mb-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Pros
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {aiAnalysis.pros.slice(0, 3).map((pro, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-400">•</span> {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Cons */}
            {aiAnalysis.cons && aiAnalysis.cons.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Cons
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {aiAnalysis.cons.slice(0, 3).map((con, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-400">•</span> {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Best For */}
            {aiAnalysis.bestFor && (
              <div className="p-2 rounded bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary">
                  <span className="font-medium">Best for:</span> {aiAnalysis.bestFor}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OptionCard;
