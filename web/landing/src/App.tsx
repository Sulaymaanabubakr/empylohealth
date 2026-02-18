import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import Terms from './pages/legal/Terms';
import DeleteAccount from './pages/legal/DeleteAccount';
import CommunityGuidelines from './pages/legal/CommunityGuidelines';
import Download from './pages/Download';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/features" element={<Home />} /> {/* Anchor link or separate page */}
          <Route path="/contact" element={<Contact />} />

          <Route path="/download" element={<Download />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/delete-account" element={<DeleteAccount />} />

          <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/delete-account" element={<DeleteAccount />} />
          <Route path="/legal/community-guidelines" element={<CommunityGuidelines />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
