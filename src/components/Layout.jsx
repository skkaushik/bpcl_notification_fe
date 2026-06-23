import React, { useState, useEffect } from "react";
import { BsStars } from 'react-icons/bs';
import Header from "./Header";
import AIAssistantWidget from "./AIAssistantWidget";

const Layout = ({ children, hasData, activeView, setActiveView, dateRange, setDateRange, ageFilter, setAgeFilter, onUploadClick, onSendEmailClick }) => {
  const [showAIChat, setShowAIChat] = useState(false);
  const [viewMode, setViewMode] = useState("modal");
  const [isAIVisible, setIsAIVisible] = useState(true);

  useEffect(() => {
    const cycleTime = 15000;

    const intervalId = setInterval(() => {
      setIsAIVisible(true);
      setTimeout(() => setIsAIVisible(false), 10000);
    }, cycleTime);

    const initialTimeoutId = setTimeout(() => {
      setIsAIVisible(false);
    }, 10000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialTimeoutId);
    };
  }, []);
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#e6e6e675] font-sans text-slate-900">
      <div className="flex-shrink-0 z-30">
        <Header
          hasData={hasData}
          activeView={activeView}
          setActiveView={setActiveView}
          dateRange={dateRange}
          setDateRange={setDateRange}
          ageFilter={ageFilter}
          setAgeFilter={setAgeFilter}
          onUploadClick={onUploadClick}
          onSendEmailClick={onSendEmailClick}
        />


        <AIAssistantWidget
          isOpen={showAIChat}
          setIsOpen={setShowAIChat}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
      <div className="flex flex-1 min-w-0 min-h-0 relative">
        <main className="flex-1 h-full w-full overflow-y-auto">
          <div className="w-full">{children}</div>
        </main>

        {/* Floating Ask AI Button */}
        {/* <button
          onClick={() => setShowAIChat(true)}
          className={`absolute top-1/2 -translate-y-1/2 right-6 z-40 cursor-pointer group flex items-center justify-center p-[2px] rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-700 ease-in-out ${isAIVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'
            }`}
        >
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full h-full w-full shadow-inner">
            <BsStars size={20} className="text-yellow-600 animate-pulse" />
            <span className="text-base font-bold text-slate-800">Ask AI</span>
          </div>
        </button> */}
      </div>
    </div>
  );
};

export default Layout;