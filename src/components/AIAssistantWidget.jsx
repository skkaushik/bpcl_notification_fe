import React, { useState, useRef, useEffect } from 'react';
import {
  MdClose, MdArrowUpward, MdOutlineLightbulb,
  MdOutlineSettings, MdPeopleOutline, MdCheck, MdRefresh, MdEdit
} from 'react-icons/md';
import { FiLayout, FiSidebar, FiMaximize, FiCopy } from 'react-icons/fi';
import { askAI } from "../services/chatService";
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
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const messagesEndRef = useRef(null);
  const layoutMenuRef = useRef(null);

  const geminiChatRef = useRef(null);
  const openaiHistoryRef = useRef([]);
  const sessionProviderRef = useRef(null);
  const sessionKeyRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target)) {
        setShowLayoutMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && (viewMode === 'modal' || viewMode === 'floating')) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, viewMode, setIsOpen]);

  useEffect(() => {
    geminiChatRef.current = null;
    openaiHistoryRef.current = [];
    sessionProviderRef.current = null;
    sessionKeyRef.current = null;
  }, [provider, apiKey, contextData]);

  const getSystemInstruction = (forProvider) => {
    if (contextData.length > 0) {
      let dataString = JSON.stringify(contextData);

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

      const sampleRow = contextData[0] || {};
      const columns = Object.keys(sampleRow).join(', ');

      const normalizeKey = (key = '') => String(key).replace(/\s+/g, '').toLowerCase();
      const keys = Object.keys(sampleRow);

      const typeKey = keys.find(k => normalizeKey(k).includes('type'));
      const statusKey = keys.find(k => normalizeKey(k) === 'status' || normalizeKey(k).includes('userstatus'));
      const priorityKey = keys.find(k => normalizeKey(k).includes('priority'));
      const unitKey = keys.find(k => normalizeKey(k).includes('workctr') || normalizeKey(k) === 'unit');

      const stats = {
        totalRows: contextData.length,
        types: {},
        statuses: {},
        priorities: {},
        units: { MR: 0, MS: 0 }
      };

      contextData.forEach(row => {
        if (typeKey) {
          const t = String(row[typeKey] || 'N/A').trim();
          stats.types[t] = (stats.types[t] || 0) + 1;
        }
        if (statusKey) {
          const s = String(row[statusKey] || 'N/A').trim();
          stats.statuses[s] = (stats.statuses[s] || 0) + 1;
        }
        if (priorityKey) {
          const p = String(row[priorityKey] || 'N/A').trim();
          stats.priorities[p] = (stats.priorities[p] || 0) + 1;
        }
        if (unitKey) {
          const u = String(row[unitKey] || '').trim().toUpperCase();
          if (u.startsWith('MR')) stats.units.MR++;
          else if (u.startsWith('MS')) stats.units.MS++;
        }
      });

      const statsText = `
PRE-CALCULATED EXACT COUNTS:
(IMPORTANT: Large language models cannot reliably count thousands of JSON objects. ALWAYS use these exact pre-calculated numbers when asked for counts, totals, or breakdowns of the dataset.)
- Total Notifications: ${stats.totalRows}
- By Notification Type: ${Object.entries(stats.types).map(([k, v]) => `${k} (${v})`).join(', ')}
- By User Status: ${Object.entries(stats.statuses).map(([k, v]) => `${k} (${v})`).join(', ')}
- By Priority: ${Object.entries(stats.priorities).map(([k, v]) => `${k} (${v})`).join(', ')}
- By Equipment Category: Rotary/MR (${stats.units.MR}), Static/MS (${stats.units.MS})
`;

      return `You are an expert industrial maintenance data analyst. You have access to a dataset of ${contextData.length} notification records from an SAP Plant Maintenance system.

COLUMNS IN THE DATA: ${columns}
${statsText}

KEY DOMAIN KNOWLEDGE:
- "Main WorkCtr" (Work Center) is often referred to by users as "Unit" or "Plant Name". It contains unit identifiers. Values starting with "MR" = Rotary equipment, "MS" = Static equipment. The part after MR/MS is the unit name.
- "Notifictn type" or "Type" is often referred to by users as "Notification Type". It contains notification types: M1 (Breakdown), M2 (Preventive Maintenance), M3, M4, M5, M6, M7, M8, M9.
- "User status" or "Status" column shows notification statuses like CRTD, NOPR, NOCO, etc.
- "Required End" column shows the deadline. If this date is in the past, the notification is OVERDUE.
- "Notif.date" column shows when the notification was created.
- "Notification" column is the unique notification ID.
- "Equipment" column identifies the specific equipment/machine.

ANALYSIS RULES:
- ALWAYS rely on the "PRE-CALCULATED EXACT COUNTS" section above for aggregate numbers. DO NOT attempt to count the JSON rows manually.
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

  const handleSend = async (promptText = input) => {
    const sessionId =
  localStorage.getItem("session_id");

if (!sessionId) {
  alert("Please upload a file first.");
  return;
}
  if (!promptText.trim() || isLoading) return;

  const userMessage = {
    role: "user",
    text: promptText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  setMessages((prev) => [...prev, userMessage]);

  setInput("");
  setIsLoading(true);

  try {
    const response = await askAI({
      sessionId,
      message: promptText,
    });

    const aiMessage = {
      role: "model",
      text:
        response?.data?.message ||
        "No response received from AI.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, aiMessage]);
  } catch (error) {
    console.error("CHAT API ERROR:", error);

    setMessages((prev) => [
      ...prev,
      {
        role: "model",
        text: "Failed to get response from server.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
    ]);
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
    { text: "Give me a summary of overdue notifications", icon: <MdOutlineLightbulb className="text-amber-500" size={18} /> },
    { text: "Which specific equipment has the most issues?", icon: <MdOutlineSettings className="text-[#003865]" size={18} /> },
    { text: "Give me a breakdown of notification priorities", icon: <MdPeopleOutline className="text-emerald-500" size={18} /> }
  ];

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

  const renderMessageContent = (text) => {
    if (!text) return null;

    const parts = text.split(/```chart\s*\n?([\s\S]*?)```/g);

    return parts.map((part, idx) => {

      if (idx % 2 === 0) {

        const trimmed = part.trim();
        return trimmed ? <div key={idx} className="whitespace-pre-wrap">{trimmed}</div> : null;
      } else {

        try {
          const chartConfig = JSON.parse(part.trim());
          return <div key={idx}>{renderChart(chartConfig)}</div>;
        } catch (e) {

          return <pre key={idx} className="bg-slate-100 p-3 rounded-xl text-xs overflow-auto my-2">{part}</pre>;
        }
      }
    });
  };

  const getContainerStyles = () => {
    switch (viewMode) {
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

      {isOpen && viewMode === 'modal' && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)}></div>
      )}

      {isOpen && (
        <div className={`bg-white flex flex-col border border-slate-200 ${getContainerStyles()}`}>

          <div className="relative z-20 bg-[#003865] border-b border-[#002244] text-white px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center shrink-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center bg-[#ffc000] rounded-md">
                <BsStars size={18} className="text-[#003865]" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg leading-none tracking-tight text-white">Notifications AI</h3>
                <p className="text-slate-300 text-[10px] font-medium mt-1">Your analytics copilot</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">

              <div className="relative" ref={layoutMenuRef}>
                <button
                  onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                  className="text-slate-300 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <FiLayout size={18} />
                </button>

                {showLayoutMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 text-slate-700 font-medium">
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">Switch to</div>

                    <button onClick={() => { setViewMode('modal'); setShowLayoutMenu(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <div className="flex items-center space-x-3"><FiLayout className={viewMode === 'modal' ? "text-[#003865]" : "text-slate-400"} /> <span className={viewMode === 'modal' ? "text-[#003865] font-bold" : "text-slate-600"}>Modal</span></div>
                      {viewMode === 'modal' && <MdCheck className="text-[#003865]" />}
                    </button>

                    <button onClick={() => { setViewMode('floating'); setShowLayoutMenu(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <div className="flex items-center space-x-3"><BsWindowDesktop className={viewMode === 'floating' ? "text-[#003865]" : "text-slate-400"} /> <span className={viewMode === 'floating' ? "text-[#003865] font-bold" : "text-slate-600"}>Floating</span></div>
                      {viewMode === 'floating' && <MdCheck className="text-[#003865]" />}
                    </button>

                    <button onClick={() => { setViewMode('sidebar'); setShowLayoutMenu(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <div className="flex items-center space-x-3"><FiSidebar className={viewMode === 'sidebar' ? "text-[#003865]" : "text-slate-400"} /> <span className={viewMode === 'sidebar' ? "text-[#003865] font-bold" : "text-slate-600"}>Sidebar</span></div>
                      {viewMode === 'sidebar' && <MdCheck className="text-[#003865]" />}
                    </button>

                    <button onClick={() => { setViewMode('fullscreen'); setShowLayoutMenu(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <div className="flex items-center space-x-3"><FiMaximize className={viewMode === 'fullscreen' ? "text-[#003865]" : "text-slate-400"} /> <span className={viewMode === 'fullscreen' ? "text-[#003865] font-bold" : "text-slate-600"}>Full screen</span></div>
                      {viewMode === 'fullscreen' && <MdCheck className="text-[#003865]" />}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-white hover:bg-rose-500 p-2 rounded-lg transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col relative">


            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="bg-[#ffc000]/20 text-[#003865] p-4 rounded-3xl mb-6 shadow-sm border border-[#ffc000]/30">
                  <BsStars size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Good Afternoon!</h2>
                <p className="text-slate-500 mb-8 max-w-sm text-sm font-medium leading-relaxed">
                  Ask a question or pick a suggestion below.<br />
                  <span className="text-slate-400">I can help you analyze unit performance, track overdue notifications, and monitor equipment statuses.</span>
                </p>

                <div className="flex flex-wrap justify-center gap-3 w-full max-w-lg">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug.text)}
                      className="flex items-center space-x-2 bg-white text-slate-700 border border-slate-200 hover:bg-[#003865]/5 hover:border-[#003865]/20 hover:text-[#003865] transition-all px-4 py-2.5 rounded-2xl text-sm font-bold shadow-sm"
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
                  <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-sm ${msg.role === 'user'
                      ? 'bg-[#003865] text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                      }`}>
                      <div className="leading-relaxed font-medium">
                        {msg.text ? renderMessageContent(msg.text) : (
                          <div className="flex items-center space-x-2 py-2">
                            <div className="w-2 h-2 bg-[#ffc000] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-[#ffc000] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-[#ffc000] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {msg.text && (
                      <div className={`mt-1.5 flex items-center space-x-3 px-2 text-slate-400`}>
                        {msg.timestamp && (
                          <span className="text-[12px] font-medium text-slate-400 mr-1">{msg.timestamp}</span>
                        )}
                        <div className="relative flex items-center">
                          <button onClick={() => handleCopy(msg.text, index)} className="hover:text-[#003865] transition-colors" title="Copy">
                            {copiedIndex === index ? <MdCheck size={16} className="text-emerald-500" /> : <FiCopy size={16} />}
                          </button>
                          {copiedIndex === index && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap z-50 animate-fade-in">
                              Copied to clipboard
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <button onClick={() => { setInput(msg.text); document.querySelector('input[placeholder="Ask about notifications, units, or equipment..."]')?.focus(); }} className="hover:text-[#003865] transition-colors" title="Edit">
                            <MdEdit size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] p-4 rounded-3xl text-sm shadow-sm bg-white text-slate-800 border border-slate-200 rounded-bl-sm">
                      <div className="leading-relaxed font-medium">
                        <div className="flex items-center space-x-2 py-2">
                          <div className="w-2 h-2 bg-[#ffc000] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-[#ffc000] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-[#ffc000] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <div className="relative flex items-center border border-slate-300 rounded-3xl bg-white focus-within:border-[#ffc000] focus-within:ring-2 focus-within:ring-[#ffc000]/20 transition-all px-4 py-2 mx-auto max-w-3xl">
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
                className={`ml-2 p-2 rounded-xl transition-colors cursor-pointer flex shrink-0 ${input.trim()
                  ? 'bg-[#ffc000] text-[#003865] hover:bg-yellow-400 shadow-md shadow-[#ffc000]/20'
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
