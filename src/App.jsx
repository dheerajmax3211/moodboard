import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Board from './pages/Board';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
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
