import React, { useState, useRef, useEffect } from 'react';
import { BsStars } from 'react-icons/bs';

const Header = ({ hasData = false, activeView, setActiveView }) => {
  const [showAIProviderMenu, setShowAIProviderMenu] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [providerForKey, setProviderForKey] = useState(null);
  const [keyInput, setKeyInput] = useState('');

  const aiMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target)) {
        setShowAIProviderMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProviderSelect = (provider) => {
    setShowAIProviderMenu(false);

    let key = localStorage.getItem(`ai_key_${provider}`);
    if (!key) {
      setProviderForKey(provider);
      setKeyInput('');
      setShowKeyModal(true);
      return;
    }

    window.dispatchEvent(new CustomEvent('open-ai-widget', {
      detail: { provider, apiKey: key }
    }));
  };

  const handleKeySubmit = () => {
    if (keyInput.trim()) {
      localStorage.setItem(`ai_key_${providerForKey}`, keyInput.trim());
      setShowKeyModal(false);
      window.dispatchEvent(new CustomEvent('open-ai-widget', {
        detail: { provider: providerForKey, apiKey: keyInput.trim() }
      }));
    }
  };
  return (
    <header className="sticky top-0 z-30 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 flex flex-col shadow-sm">

      <div className="flex items-center justify-between px-8 h-[52px]">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">

          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center bg-[#4F46E5] rounded-md">
              <span className="text-white text-sm">⚡</span>
            </div>
            <h1 className="text-base font-black leading-none tracking-tight text-slate-900">
              Notifications Analytics
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {hasData && (
            <div className="relative" ref={aiMenuRef}>
              <button
                onClick={() => setShowAIProviderMenu(!showAIProviderMenu)}
                className="cursor-pointer relative group flex items-center justify-center p-[1.5px] rounded-full bg-gradient-to-r from-blue-500 via-purple-400 to-orange-500 shadow-sm hover:shadow-md hover:scale-105 transition-all"
              >
                <div className="flex items-center gap-2 px-5 py-1.5 bg-white rounded-full h-full w-full">
                  <BsStars size={18} className="text-orange-500" />
                  <span className="text-sm font-bold text-slate-800">Ask AI</span>
                </div>
              </button>

              {showAIProviderMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 overflow-hidden">
                  <div className="px-4 py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">Select Provider</div>
                  <button
                    onClick={() => handleProviderSelect('openai')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
                  >
                    OpenAI (GPT-4o)
                  </button>
                  <button
                    onClick={() => handleProviderSelect('gemini')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
                  >
                    Google Gemini
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-xs font-bold text-slate-900">Ankur Sharma</p>
              <p className="text-[10px] font-medium text-slate-500">Site Manager</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-slate-200 ring-2 ring-white overflow-hidden shadow-sm flex-shrink-0">
              <img src="https://ui-avatars.com/api/?name=Ankur+Sharma&background=6366f1&color=fff" alt="User" />
            </div>
          </div>
        </div>
      </div>

      {setActiveView && (
        <div className="px-8 flex items-center gap-6">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`text-sm font-semibold h-10 flex items-center border-b-[3px] transition-all ${activeView === "dashboard"
              ? "text-[#4F46E5] border-[#4F46E5]"
              : "text-slate-600 border-transparent hover:text-slate-900"
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveView("critical")}
            className={`text-sm font-semibold h-10 flex items-center border-b-[3px] transition-all ${activeView === "critical"
              ? "text-[#4F46E5] border-[#4F46E5]"
              : "text-slate-600 border-transparent hover:text-slate-900"
              }`}
          >
            Critical Equipment
          </button>
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in border border-slate-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Enter {providerForKey === 'openai' ? 'OpenAI' : 'Gemini'} API Key
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Your key will be securely saved in your browser's local storage and used to communicate directly with the AI provider.
              </p>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">API Key</label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-slate-800 font-mono text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleKeySubmit()}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleKeySubmit}
                  disabled={!keyInput.trim()}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 transition-all"
                >
                  Save & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;