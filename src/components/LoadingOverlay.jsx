import React from 'react';

export default function LoadingOverlay({ stage }) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true" />
        <h2>Samantha is analyzing...</h2>
        <p className="loading-stage">{stage || 'Initializing...'}</p>
        <p className="loading-note">This may take 30-60 seconds</p>
      </div>
    </div>
  );
}
