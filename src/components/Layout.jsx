import React, { useState } from "react";
import Header from "./Header";
import AIAssistantWidget from "./AIAssistantWidget";


const Layout = ({ children, hasData, activeView, setActiveView }) => {
  const [showAIChat, setShowAIChat] = useState(false);
  const [viewMode, setViewMode] = useState("modal");
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FFFFFF] font-sans text-slate-900">
      <div className="flex-shrink-0 z-30">
        <Header
  hasData={hasData}
  activeView={activeView}
  setActiveView={setActiveView}
  onOpenAIChat={() => setShowAIChat(true)}
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
      </div>
    </div>
  );
};

export default Layout;