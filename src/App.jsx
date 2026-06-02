import React, { useState, useEffect } from 'react';
import Dashboard from './pages/dashboard';
import AIAssistantWidget from './components/AIAssistantWidget';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiViewMode, setAiViewMode] = useState('modal');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [contextData, setContextData] = useState([]);

  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail) {
        if (e.detail.provider) setAiProvider(e.detail.provider);
        if (e.detail.apiKey) setAiApiKey(e.detail.apiKey);
      }
      setIsAIOpen(true);
    };
    
    const handleDataLoaded = (e) => {
      if (e.detail) setContextData(e.detail);
    };

    window.addEventListener('open-ai-widget', handleOpen);
    window.addEventListener('data-loaded', handleDataLoaded);
    return () => {
      window.removeEventListener('open-ai-widget', handleOpen);
      window.removeEventListener('data-loaded', handleDataLoaded);
    };
  }, []);

  return (
    <div className={`transition-all duration-300 ${isAIOpen && aiViewMode === 'sidebar' ? 'mr-96' : ''}`}>
      <Dashboard />
      <AIAssistantWidget 
        isOpen={isAIOpen} 
        setIsOpen={setIsAIOpen} 
        viewMode={aiViewMode} 
        setViewMode={setAiViewMode}
        provider={aiProvider}
        apiKey={aiApiKey}
        contextData={contextData}
      />
      <ToastContainer
  position="top-center"
  autoClose={3000}
/>

    </div>
    
  );
}

export default App;