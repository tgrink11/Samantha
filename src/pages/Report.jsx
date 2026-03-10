import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import StickyNav from '../components/StickyNav';
import ExecutiveSummary from '../components/ExecutiveSummary';
import Quantitative from '../components/Quantitative';
import KeyRatios from '../components/KeyRatios';
import GrowthRule40 from '../components/GrowthRule40';
import MarketTAM from '../components/MarketTAM';
import PeerComparison from '../components/PeerComparison';
import Forecasts from '../components/Forecasts';
import RiskDashboard from '../components/RiskDashboard';
import Qualitative from '../components/Qualitative';
import CallToAction from '../components/CallToAction';
import Podcast from '../components/Podcast';
import Footer from '../components/Footer';
import '../styles/report.css';

function getInitialReport(locationState) {
  // 1. Check React Router location state (from Analyze page)
  if (locationState?.report) return locationState.report;
  // 2. Check sessionStorage (demo mode / dev testing)
  try {
    const demo = sessionStorage.getItem('demoReport');
    if (demo) return JSON.parse(demo);
  } catch (e) { /* ignore */ }
  return null;
}

export default function Report() {
  const { ticker } = useParams();
  const location = useLocation();

  const initial = getInitialReport(location.state);
  const [report, setReport] = useState(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState(null);

  // Convert base64 podcast audio to blob URL
  const audioUrl = useMemo(() => {
    const b64 = report?.report_json?.podcastAudio;
    if (!b64) return report?.podcast_url || null;
    try {
      const byteChars = atob(b64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.warn('Failed to decode podcast audio:', err);
      return report?.podcast_url || null;
    }
  }, [report]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Fetch report from API if not available locally
  useEffect(() => {
    if (report) return;

    async function fetchReport() {
      try {
        const res = await fetch(`/api/report?ticker=${ticker}`);
        if (res.status === 404) {
          setError('not-found');
          return;
        }
        if (!res.ok) throw new Error('Failed to load report');
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [ticker, report]);

  if (loading) {
    return (
      <div className="report-page">
        <div className="spinner" aria-label="Loading report" />
      </div>
    );
  }

  if (error === 'not-found') {
    return (
      <div className="report-page">
        <div className="report-not-found">
          <h2>Report Not Found</h2>
          <p>No analysis found for ticker: {ticker}</p>
          <Link to="/analyze" className="btn-primary">Analyze This Stock</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-page">
        <div className="report-not-found">
          <h2>Error Loading Report</h2>
          <p>{error}</p>
          <Link to="/" className="btn-primary">Back to Directory</Link>
        </div>
      </div>
    );
  }

  const data = report?.report_json || {};
  const analysisDate = report?.analysis_date;
  const userName = report?.user_name;
  const sharesHeld = report?.input_shares;
  const portfolioWeight = report?.input_portfolio_pct
    ? `${report.input_portfolio_pct}%`
    : null;

  return (
    <div className="report-page">
      <Header date={analysisDate} userName={userName} />

      <HeroSection
        data={data}
        sharesHeld={sharesHeld}
        portfolioWeight={portfolioWeight}
      />

      <StickyNav />

      <div className="report-content">
        <ExecutiveSummary data={data} />
        <Quantitative data={data} />
        <KeyRatios data={data} />
        <GrowthRule40 data={data} />
        <MarketTAM data={data?.marketTAM} />
        <PeerComparison data={data?.peerComparison} />
        <Forecasts data={data?.forecasts} />
        <RiskDashboard data={data?.riskDashboard} />
        <Qualitative data={data?.qualitative} />
        <CallToAction data={data?.callToAction} />
        <Podcast
          audioUrl={audioUrl}
          ticker={ticker}
          companyName={data?.company?.name}
        />
      </div>

      <Footer date={analysisDate} />
    </div>
  );
}
