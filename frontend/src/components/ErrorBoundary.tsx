import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components
 * and displays a fallback UI with error details and retry option.
 * 
 * Requirements: 7.3, 7.4, 7.6
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Try refreshing the page or clicking the retry button below. If the problem persists, 
              please contact support.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={this.handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
