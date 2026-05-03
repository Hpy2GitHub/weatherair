// ErrorBoundary.jsx
import { Component } from 'react';
import './error-boundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo: errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error);
    console.error('Error details:', errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  refreshPage = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }
      return this.renderDefaultErrorUI();
    }

    return children;
  }

  renderDefaultErrorUI() {
    const { error, errorInfo, retryCount } = this.state;

    return (
      <div className="error-boundary-container">
        <div className="error-boundary-card">
          <div className="error-boundary-icon-container">
            <div className="error-boundary-icon">⚠️</div>
          </div>

          <h1 className="error-boundary-title">Something went wrong</h1>
          
          <p className="error-boundary-message">
            The application encountered an unexpected error.
          </p>

          {error && (
            <details className="error-boundary-details">
              <summary className="error-boundary-summary">Show error details</summary>
              <div className="error-boundary-error-details">
                <h4>Error Message:</h4>
                <code>{error.toString()}</code>

                {errorInfo?.componentStack && (
                  <>
                    <h4>Component Stack:</h4>
                    <pre>{errorInfo.componentStack}</pre>
                  </>
                )}

                {error?.stack && (
                  <>
                    <h4>Stack Trace:</h4>
                    <pre>{error.stack}</pre>
                  </>
                )}
              </div>
            </details>
          )}

          <div className="error-boundary-actions">
            <button onClick={this.resetErrorBoundary} className="error-boundary-primary-button">
              Try Again {retryCount > 0 && `(Attempt ${retryCount + 1})`}
            </button>
            
            <button onClick={this.refreshPage} className="error-boundary-secondary-button">
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
