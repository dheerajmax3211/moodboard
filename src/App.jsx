import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Board from './pages/Board';
import { ToastProvider } from './components/Toast';

// Base path for GitHub Pages - must match vite.config.js base
const basename = import.meta.env.BASE_URL;

function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename={basename}>
        <div className="animated-bg"></div>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/board/:boardName" element={<Board />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
