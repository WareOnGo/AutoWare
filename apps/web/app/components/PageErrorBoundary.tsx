import { ErrorBoundary } from "./ErrorBoundary";
import { Button } from "./Button";
import { useNavigate } from "react-router";

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

/**
 * Page-level error boundary with navigation options
 * Wraps page components to catch and display errors gracefully
 */
export function PageErrorBoundary({ children, pageName = "page" }: PageErrorBoundaryProps) {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error loading {pageName}
            </h2>
            <p className="text-gray-600 mb-6">
              {error.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Try Again</Button>
              <Button onClick={() => navigate("/")} variant="secondary">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
