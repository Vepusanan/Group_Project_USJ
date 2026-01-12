import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 shadow-2xl text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-white mb-3">
                Something Went Wrong
              </h1>

              <p className="text-gray-400 mb-6">
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-left max-h-32 overflow-auto">
                  <p className="text-red-400 text-xs font-mono break-words">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                <a
                  href="/"
                  className="px-6 py-3 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-900/20 transition-colors font-medium"
                >
                  Go to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;