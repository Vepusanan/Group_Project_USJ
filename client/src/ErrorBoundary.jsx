import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-page flex items-center justify-center px-4">
          <div className="max-w-md w-full surface-card p-8 text-center">
            <svg
              className="w-16 h-16 text-error mx-auto mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-content mb-3">
              Something Went Wrong
            </h1>
            <p className="text-content-secondary mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-error/10 border border-error/30 rounded-lg p-4 mb-6 text-left max-h-32 overflow-auto">
                <p className="text-error text-xs font-mono break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-primary-token px-6 py-3"
              >
                Try Again
              </button>
              <a href="/" className="btn-secondary-token px-6 py-3">
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
