import React from 'react';

export function LoadingSpinner({ size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-lg font-medium text-foreground mb-2">Loading...</h2>
        <p className="text-sm text-muted-foreground">
          Connecting to backend and initializing user session
        </p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
