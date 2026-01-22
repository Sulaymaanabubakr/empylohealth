import Hero from '../components/Hero';
import Features from '../components/Features'; // Will create next
import AppShowcase from '../components/AppShowcase'; // Will create next
import CallToAction from '../components/CallToAction'; // Will create next

const Home = () => {
    return (
        <div className="home-page">
            <Hero />
            <Features />
            <AppShowcase />
            <CallToAction />
        </div>
    );
};

export default Home;
