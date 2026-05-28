import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { 
  MdClose, MdArrowUpward, MdOutlineLightbulb, 
  MdOutlineSettings, MdPeopleOutline, MdCheck
} from 'react-icons/md';
import { FiLayout, FiSidebar, FiMaximize, FiCopy } from 'react-icons/fi';
import { BsStars, BsWindowDesktop } from 'react-icons/bs';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const AIAssistantWidget = ({ isOpen, setIsOpen, viewMode, setViewMode, provider = 'gemini', apiKey = '', contextData = [] }) => {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const layoutMenuRef = useRef(null);

  // ─── Persistent chat session refs ─────────────────────
  const geminiChatRef = useRef(null);       // Gemini chat session object
  const openaiHistoryRef = useRef([]);      // OpenAI message history array
  const sessionProviderRef = useRef(null);  // Track which provider the session was created for
  const sessionKeyRef = useRef(null);       // Track which API key the session was created with


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Close layout menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target)) {
        setShowLayoutMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key when in modal or floating mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && (viewMode === 'modal' || viewMode === 'floating')) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, viewMode, setIsOpen]);

  // ─── Reset chat session when provider/key/data changes ─
  useEffect(() => {
    geminiChatRef.current = null;
    openaiHistoryRef.current = [];
    sessionProviderRef.current = null;
    sessionKeyRef.current = null;
  }, [provider, apiKey, contextData]);

  // ─── Build system instruction ──────────────────────────
  const getSystemInstruction = (forProvider) => {
    if (contextData.length > 0) {
      let dataString = JSON.stringify(contextData);

      // OpenAI has 128k token limit — truncate if needed
      if (forProvider === 'openai' && dataString.length > 400000) {
        let truncated = [];
        let len = 0;
        for (const row of contextData) {
          const rowStr = JSON.stringify(row);
          if (len + rowStr.length > 400000) break;
          truncated.push(row);
          len += rowStr.length;
        }
        dataString = JSON.stringify(truncated) + 
          `\n\n[Data truncated for OpenAI. Showing ${truncated.length} of ${contextData.length} rows. Use Google Gemini for full dataset analysis.]`;
      }

      // Extract column names from data for schema awareness
      const sampleRow = contextData[0] || {};
      const columns = Object.keys(sampleRow).join(', ');

      return `You are an expert industrial maintenance data analyst. You have access to a dataset of ${contextData.length} notification records from an SAP Plant Maintenance system.

COLUMNS IN THE DATA: ${columns}

KEY DOMAIN KNOWLEDGE:
- "Main WorkCtr" (Work Center) column contains unit identifiers. Values starting with "MR" = Rotary equipment, "MS" = Static equipment. The part after MR/MS is the unit name.
- "Notifictn type" or "Type" column contains notification types: M1 (Breakdown), M2 (Preventive Maintenance), M3, M4, M5, M6, M7, M8, M9.
- "User status" or "Status" column shows notification statuses like CRTD, NOPR, NOCO, etc.
- "Required End" column shows the deadline. If this date is in the past, the notification is OVERDUE.
- "Notif.date" column shows when the notification was created.
- "Notification" column is the unique notification ID.
- "Equipment" column identifies the specific equipment/machine.

ANALYSIS RULES:
- When counting or grouping (e.g., "total user status"), you must iterate through ALL rows in the JSON carefully and count the exact occurrences of each value.
- NEVER hallucinate or guess numbers. Count them precisely from the provided JSON.
- When grouping by unit, remove the MR/MS prefix first (e.g., "MRFCC" → unit is "FCC").
- Unique notifications = count distinct values in the "Notification" column.
- Only count rows where "Main WorkCtr" starts with "MR" or "MS" unless told otherwise.

RESPONSE RULES:
- Keep answers concise and factual. Use bullet points or short tables for clarity.
- If the user asks for a chart/graph/visualization, include a fenced code block:
\`\`\`chart
{"title":"Chart Title","type":"bar","data":[{"name":"Label","value":10}]}
\`\`\`
Chart types: "bar", "pie", "line". Only include charts when explicitly requested.

DATA (${contextData.length} rows):
${dataString}`;
    }
    return "You are a helpful analytics assistant.";
  };

  // ─── Core: Send message to AI ──────────────────────────
  const handleSend = async (promptText = input) => {
    if (!promptText.trim() || isLoading) return;

    // Guard: no API key
    if (!apiKey) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `⚠️ API Key is missing. Please select a provider from the header and enter your key for ${provider === 'openai' ? 'OpenAI' : 'Google Gemini'}.` 
      }]);
      return;
    }

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', text: promptText }]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText = '';

      if (provider === 'gemini') {
        // ── Gemini: Use persistent chat session ──
        if (!geminiChatRef.current || sessionProviderRef.current !== 'gemini' || sessionKeyRef.current !== apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const sysInstruction = getSystemInstruction('gemini');
          geminiChatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { 
              systemInstruction: sysInstruction,
              temperature: 0,
            },
          });
          sessionProviderRef.current = 'gemini';
          sessionKeyRef.current = apiKey;
        }

        const response = await geminiChatRef.current.sendMessage({ message: promptText });
        responseText = response.text;
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);

      } else if (provider === 'openai') {
        // ── OpenAI: Maintain history with streaming ──
        if (openaiHistoryRef.current.length === 0 || sessionProviderRef.current !== 'openai' || sessionKeyRef.current !== apiKey) {
          const sysInstruction = getSystemInstruction('openai');
          openaiHistoryRef.current = [{ role: 'system', content: sysInstruction }];
          sessionProviderRef.current = 'openai';
          sessionKeyRef.current = apiKey;
        }

        openaiHistoryRef.current.push({ role: 'user', content: promptText });

        // Add placeholder for streaming
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: openaiHistoryRef.current,
          stream: true,
          temperature: 0,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          responseText += text;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', text: responseText };
            return updated;
          });
        }

        openaiHistoryRef.current.push({ role: 'assistant', content: responseText });
      }

      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: `❌ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    { text: "Show overdue M2 notifications", icon: <MdOutlineLightbulb className="text-amber-500" size={18} /> },
    { text: "Which units have the most issues?", icon: <MdOutlineSettings className="text-indigo-400" size={18} /> },
    { text: "Summarize static equipment alerts", icon: <MdPeopleOutline className="text-emerald-500" size={18} /> }
  ];

  // ─── Chart Renderer ────────────────────────────────────
  const renderChart = (chartConfig) => {
    const { title, type, data } = chartConfig;
    if (!data || data.length === 0) return null;

    return (
      <div className="my-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
        {title && <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</p>}
        <ResponsiveContainer width="100%" height={220}>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          ) : type === 'pie' ? (
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
            </PieChart>
          ) : type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
            </LineChart>
          ) : null}
        </ResponsiveContainer>
      </div>
    );
  };

  // ─── Parse AI response for text + charts ───────────────
  const renderMessageContent = (text) => {
    if (!text) return null;

    // Split on ```chart ... ``` blocks
    const parts = text.split(/```chart\s*\n?([\s\S]*?)```/g);

    return parts.map((part, idx) => {
      // Even indices are text, odd indices are chart JSON
      if (idx % 2 === 0) {
        // Regular text
        const trimmed = part.trim();
        return trimmed ? <div key={idx} className="whitespace-pre-wrap">{trimmed}</div> : null;
      } else {
        // Chart JSON
        try {
          const chartConfig = JSON.parse(part.trim());
          return <div key={idx}>{renderChart(chartConfig)}</div>;
        } catch (e) {
          // If JSON parse fails, render as code block
          return <pre key={idx} className="bg-slate-100 p-3 rounded-xl text-xs overflow-auto my-2">{part}</pre>;
        }
      }
    });
  };

  // Layout styles based on viewMode
  const getContainerStyles = () => {
    switch(viewMode) {
      case 'floating':
        return "fixed bottom-6 right-6 w-96 h-[32rem] rounded-2xl shadow-2xl z-50 overflow-hidden";
      case 'sidebar':
        return "fixed top-0 right-0 w-96 h-screen shadow-2xl z-50 overflow-hidden";
      case 'fullscreen':
        return "fixed inset-0 w-full h-full z-50 overflow-hidden";
      case 'modal':
      default:
        return "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[700px] rounded-2xl shadow-2xl z-50 overflow-hidden";
    }
  };

  return (
    <>


      {/* Backdrop for modal */}
      {isOpen && viewMode === 'modal' && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)}></div>
      )}

      {/* Main Container */}
      {isOpen && (
        <div className={`bg-white flex flex-col border border-slate-200 ${getContainerStyles()}`}>
          
          {/* Header */}
          <div className="relative z-20 bg-blue-100/90 backdrop-blur-md border-b border-slate-200 text-slate-800 px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                <BsStars size={20} />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg leading-none tracking-tight text-slate-900">Notifications AI</h3>
                <p className="text-slate-500 text-[10px] font-medium mt-1">Your analytics copilot</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Layout Switcher Dropdown */}
              <div className="relative" ref={layoutMenuRef}>
                <button 
                  onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                  className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                >
                  <FiLayout size={18} />
                </button>
                
                {showLayoutMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 text-slate-700 font-medium">
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">Switch to</div>
                    
                    <button onClick={() => { setViewMode('modal'); setShowLayoutMenu(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <div className="flex items-center space-x-3"><FiLayout className={viewMode==='modal' ? "text-indigo-600" : "text-slate-400"} /> <span className={viewMode==='modal' ? "text-indigo-600 font-bold" : "text-slate-600"}>Modal</span></div>
                      {viewMode === 'modal' && <MdCheck className="text-indigo-600" />}
                    </button>
                    
                    <button onClick={() => { setViewMode('floating'); setShowLayoutMenu(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <div className="flex items-center space-x-3"><BsWindowDesktop className={viewMode==='floating' ? "text-indigo-600" : "text-slate-400"} /> <span className={viewMode==='floating' ? "text-indigo-600 font-bold" : "text-slate-600"}>Floating</span></div>
                      {viewMode === 'floating' && <MdCheck className="text-indigo-600" />}
                    </button>
                    
                    <button onClick={() => { setViewMode('sidebar'); setShowLayoutMenu(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <div className="flex items-center space-x-3"><FiSidebar className={viewMode==='sidebar' ? "text-indigo-600" : "text-slate-400"} /> <span className={viewMode==='sidebar' ? "text-indigo-600 font-bold" : "text-slate-600"}>Sidebar</span></div>
                      {viewMode === 'sidebar' && <MdCheck className="text-indigo-600" />}
                    </button>
                    
                    <button onClick={() => { setViewMode('fullscreen'); setShowLayoutMenu(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <div className="flex items-center space-x-3"><FiMaximize className={viewMode==='fullscreen' ? "text-indigo-600" : "text-slate-400"} /> <span className={viewMode==='fullscreen' ? "text-indigo-600 font-bold" : "text-slate-600"}>Full screen</span></div>
                      {viewMode === 'fullscreen' && <MdCheck className="text-indigo-600" />}
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>
          </div>

          {/* Body Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col relative">
            
            {/* Welcome Screen (Show only if no messages) */}
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="bg-indigo-100 text-indigo-600 p-4 rounded-3xl mb-6 shadow-sm border border-indigo-200">
                  <BsStars size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Good Afternoon!</h2>
                <p className="text-slate-500 mb-8 max-w-sm text-sm font-medium leading-relaxed">
                  Ask a question or pick a suggestion below.<br/>
                  <span className="text-slate-400">I can help you analyze unit performance, track overdue notifications, and monitor equipment statuses.</span>
                </p>
                
                <div className="flex flex-wrap justify-center gap-3 w-full max-w-lg">
                  {suggestions.map((sug, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSend(sug.text)}
                      className="flex items-center space-x-2 bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all px-4 py-2.5 rounded-2xl text-sm font-bold shadow-sm"
                    >
                      {sug.icon}
                      <span>{sug.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <div className="flex-1 p-6 flex flex-col space-y-6">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                    }`}>
                      {msg.role === 'model' && (
                        <div className="flex items-center space-x-2 mb-2 text-indigo-600">
                          <BsStars size={16} />
                          <span className="font-bold text-xs uppercase tracking-wider">Copilot</span>
                        </div>
                      )}
                      <div className="leading-relaxed font-medium">{renderMessageContent(msg.text)}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-3xl rounded-bl-sm flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <div className="relative flex items-center border border-slate-300 rounded-3xl bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-4 py-2 mx-auto max-w-3xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about notifications, units, or equipment..."
                className="flex-1 bg-transparent border-none focus:outline-none text-slate-800 font-medium text-sm py-2"
                disabled={isLoading}
              />
              <button 
                onClick={() => handleSend(input)}
                disabled={isLoading || !input.trim()}
                className={`ml-2 p-2 rounded-xl transition-colors flex shrink-0 ${
                  input.trim() 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200' 
                    : 'text-slate-300'
                }`}
              >
                <MdArrowUpward size={20} />
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

export default AIAssistantWidget;
