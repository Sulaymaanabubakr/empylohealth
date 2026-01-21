import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hero from './components/Hero';
import Features from './components/Features';
import Contact from './components/Contact';
import DownloadApp from './components/DownloadApp';

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
          <Route path="contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
