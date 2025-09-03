import React from 'react';

// Minimal drop-in to satisfy imports without side effects
export const LazyLog = () => null;
export const ScrollFollow = ({ children }) =>
  typeof children === 'function'
    ? children({ onScroll: () => {}, scrollToBottom: () => {} })
    : null;

export default LazyLog;
