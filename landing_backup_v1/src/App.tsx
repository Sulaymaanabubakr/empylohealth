import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hero from './components/Hero';
import Features from './components/Features';
import Contact from './components/Contact'; // Still used on home if needed, or replace with ContactPage
import DownloadApp from './components/DownloadApp';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import DeleteAccount from './pages/DeleteAccount';
import AboutUs from './pages/AboutUs';
import ContactPage from './pages/ContactPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <>
              <Hero />
              <Features />
              <DownloadApp />
              <Contact />
            </>
          } />
          <Route path="features" element={<Features />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="delete-account" element={<DeleteAccount />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
