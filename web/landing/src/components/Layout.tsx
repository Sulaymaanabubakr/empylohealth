import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
    return (
        <div className="layout">
            <Navbar />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />

            <style>{`
        .layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .main-content {
          flex: 1;
        }
      `}</style>
        </div>
    );
};

export default Layout;
