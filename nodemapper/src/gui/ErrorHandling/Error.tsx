import React from 'react';

export const errorHandler = ({ error, resetErrorBoundary }) => {
  return (
    <div role="alert">
      <h1>Something went wrong...</h1>
      <button onClick={resetErrorBoundary}>Attempt resume...</button>
      <p>Or View-Reload to reset the application.</p>
      <p>
        If the error persists, please consider submitting a bug report to{' '}
        <a href="https://github.com/kraemer-lab/GRAPEVNE/issues/new/choose">GRAPEVNE Issues</a>
      </p>
      <p style={{ color: 'red', overflow: 'auto' }}>{error.message}</p>
    </div>
  );
};
