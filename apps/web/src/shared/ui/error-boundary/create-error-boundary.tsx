import React from "react";

import { getWebEnv } from "@repo/env";
import { normalizeError } from "@/shared/core/errors/normalize";

type FallbackProps = {
  reset: () => void;
  error: ReturnType<typeof normalizeError> | null;
  rawError: unknown | null;
};

type Options = {
  name: string;
  fallback?: React.ComponentType<FallbackProps>;
};

export function createErrorBoundary({ name, fallback }: Options) {
  return class GenericErrorBoundary extends React.Component<
    { children: React.ReactNode },
    {
      hasError: boolean;
      error: ReturnType<typeof normalizeError> | null;
      rawError: unknown | null;
      resetKey: number;
    }
  > {
    static readonly displayName = `ErrorBoundary(${name})`;

    override state = {
      hasError: false,
      error: null,
      rawError: null,
      resetKey: 0,
    };

    static getDerivedStateFromError(error: unknown) {
      const normalized = normalizeError(error);

      return {
        hasError: true,
        error: normalized,
        rawError: error,
      };
    }

    override componentDidCatch(error: unknown, info: React.ErrorInfo) {
      if (getWebEnv().NODE_ENV !== "production") {
        console.error("React ErrorBoundary", normalizeError(error), info);
      }
    }

    reset = () => {
      if (this.state.hasError) {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          rawError: null,
          resetKey: prev.resetKey + 1,
        }));
      }
    };

    override render() {
      if (this.state.hasError) {
        if (fallback) {
          const Fallback = fallback;
          return <Fallback reset={this.reset} error={this.state.error} rawError={this.state.rawError} />;
        }

        return (
          <div className="p-4 text-sm text-red-500">
            Something went wrong in {name}
            <button onClick={this.reset} className="ml-2 underline">
              Retry
            </button>
          </div>
        );
      }

      return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
    }
  };
}
