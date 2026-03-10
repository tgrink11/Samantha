import { HashRouter, Routes, Route } from 'react-router-dom';
import Directory from './pages/Directory';
import Analyze from './pages/Analyze';
import Report from './pages/Report';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Directory />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/report/:ticker" element={<Report />} />
      </Routes>
    </HashRouter>
  );
}
