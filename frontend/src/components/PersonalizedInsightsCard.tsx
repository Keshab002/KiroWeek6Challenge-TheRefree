import { Lightbulb, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PersonalizedInsightsCardProps {
  insights: string[];
  userContext?: string;
}

/**
 * PersonalizedInsightsCard displays AI-generated personalized advice
 * based on user's background and needs (e.g., beginner-friendly tips)
 */
export function PersonalizedInsightsCard({ insights, userContext }: PersonalizedInsightsCardProps) {
  // Always show the card - it will display a message if no insights

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Personalized Insights
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
            <Sparkles className="h-3 w-3" />
            For You
          </span>
        </CardTitle>
        {userContext && (
          <p className="text-xs text-muted-foreground mt-1">
            Based on: "{userContext.slice(0, 80)}{userContext.length > 80 ? '...' : ''}"
          </p>
        )}
      </CardHeader>
      <CardContent>
        {insights && insights.length > 0 ? (
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Add context in "Tell AI About Yourself" for personalized tips.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PersonalizedInsightsCard;
