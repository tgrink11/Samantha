import React from 'react';

export default function Footer({ date }) {
  const displayDate = date || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <footer className="report-footer">
      <strong>Best of Us Investors</strong>
      <p>Empowering Main Street investors through data-driven analysis</p>
      <p>Analysis by Samantha, AI Stock Analyst | Data as of {displayDate}</p>
      <p className="disclaimer">
        This report is for educational purposes only. Not financial advice.
        Always do your own research.
      </p>
    </footer>
  );
}
