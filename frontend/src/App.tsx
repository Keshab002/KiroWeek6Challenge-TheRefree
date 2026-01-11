import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingState } from '@/components/LoadingState';
import { ConstraintPanel } from '@/components/ConstraintPanel';
import { ComparisonView } from '@/components/ComparisonView';
import { TradeOffPanel } from '@/components/TradeOffPanel';
import { PivotSummary } from '@/components/PivotSummary';
import { AdminPanel } from '@/components/AdminPanel';
import { PersonalizedInsightsCard } from '@/components/PersonalizedInsightsCard';
import { useConstraints, useComparison, useApiHealth } from '@/hooks';
import './App.css';

/**
 * Main App component with three-panel layout.
 * Left: ConstraintPanel, Center: ComparisonView, Right: TradeOffPanel
 * Bottom: PivotSummary
 * 
 * Requirements: 8.1, 8.2, 7.1, 7.2
 */
function App() {
  const { isHealthy, isChecking, error: healthError, retry } = useApiHealth(true);
  const { constraints, updateConstraints } = useConstraints();
  const {
    comparison,
    explanation,
    pivot,
    status,
    error: comparisonError,
    availableIntegrations,
    availableOptions,
    selectedOptions,
    aiEnhanced,
    aiAnalysis,
    setSelectedOptions,
    fetchOptions,
    fetchIntegrations,
    runComparison,
  } = useComparison();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastUserContext, setLastUserContext] = useState('');

  // Fetch options and integrations when API becomes healthy
  useEffect(() => {
    if (isHealthy && !isInitialized) {
      fetchOptions().then((options) => {
        setIsInitialized(true);
        // Auto-select first two options if available
        if (options.length >= 2) {
          setSelectedOptions([options[0].id, options[1].id]);
        }
      });
    }
  }, [isHealthy, isInitialized, fetchOptions, setSelectedOptions]);

  // Fetch supported integrations when selected options change
  useEffect(() => {
    if (selectedOptions && selectedOptions[0] && selectedOptions[1]) {
      fetchIntegrations(selectedOptions);
    }
  }, [selectedOptions, fetchIntegrations]);

  const handleRunComparison = async (useAI: boolean = false, additionalContext?: string) => {
    if (!selectedOptions) return;
    if (additionalContext) {
      setLastUserContext(additionalContext);
    } else {
      setLastUserContext('');
    }
    await runComparison(constraints, selectedOptions, useAI, additionalContext);
  };

  // Show loading state while checking API health
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Connecting to server..." size="lg" />
      </div>
    );
  }

  // Show connection error if API is unavailable
  if (!isHealthy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {healthError || 'Unable to connect to the comparison service.'}
            </AlertDescription>
          </Alert>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check that the backend server is running and try again.
            </p>
            <Button onClick={retry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">The Referee</h1>
                <p className="text-sm text-muted-foreground">
                  Decision support for technical choices
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Button variant="outline" size="sm" onClick={() => setShowAdmin(true)}>
                  <Settings className="h-4 w-4 mr-1" />
                  Admin
                </Button>
                <Wifi className="h-3 w-3 text-green-500" />
                <span>Connected</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Constraints */}
            <aside className="lg:col-span-3">
              <ConstraintPanel
                constraints={constraints}
                onConstraintsChange={updateConstraints}
                onRunComparison={handleRunComparison}
                isLoading={status === 'loading'}
                availableIntegrations={availableIntegrations}
                availableOptions={availableOptions}
                selectedOptions={selectedOptions}
                onSelectedOptionsChange={setSelectedOptions}
                error={comparisonError}
              />
            </aside>

            {/* Center Panel - Comparison + Insights */}
            <section className="lg:col-span-5 space-y-4">
              {/* Side-by-Side Comparison */}
              <ComparisonView
                comparison={comparison}
                status={status}
                error={comparisonError}
                aiEnhanced={aiEnhanced}
                aiAnalysis={aiAnalysis}
              />
              
              {/* Personalized Insights Card - Show when AI analysis has insights */}
              {aiAnalysis?.personalizedInsights && aiAnalysis.personalizedInsights.length > 0 && (
                <PersonalizedInsightsCard 
                  insights={aiAnalysis.personalizedInsights}
                  userContext={lastUserContext || ''}
                />
              )}
            </section>

            {/* Right Panel - Trade-Off Analysis */}
            <aside className="lg:col-span-4">
              <TradeOffPanel
                explanation={explanation}
                status={status}
              />
            </aside>
          </div>

          {/* Bottom - Pivot Summary */}
          <div className="mt-6">
            <PivotSummary pivot={pivot} status={status} aiAnalysis={aiAnalysis} />
          </div>
        </main>

        {/* Admin Panel Modal */}
        {showAdmin && (
          <AdminPanel
            onClose={() => {
              setShowAdmin(false);
              // Refresh options after admin changes
              fetchOptions().then(() => {
                // Refetch integrations for current selection
                if (selectedOptions) {
                  fetchIntegrations(selectedOptions);
                }
              });
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
