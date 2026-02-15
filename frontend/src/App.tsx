import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import LiveDetection from './pages/LiveDetection';
import Logs from './pages/Logs';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './theme.css';

function App() {
    const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

    useEffect(() => {
        const handleHashChange = () => {
            setCurrentHash(window.location.hash || '#/');
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Route to appropriate page based on hash
    const renderPage = () => {
        switch (currentHash) {
            case '#/':
                return <Dashboard />;
            case '#/detection':
                return <LiveDetection />;
            case '#/logs':
                return <Logs />;
            case '#/analytics':
                return <Analytics />;
            case '#/reports':
                return <Reports />;
            case '#/settings':
                return <Settings />;
            default:
                return <Dashboard />;
        }
    };

    return <div className="app">{renderPage()}</div>;
}

export default App;
