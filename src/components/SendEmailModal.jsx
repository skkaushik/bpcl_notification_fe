import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { emailConfig } from '../data/emailConfig';

const ALL_TYPES = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'];

const SendEmailModal = ({ isOpen, onClose, notifications }) => {
  const [emailActiveTypeFilter, setEmailActiveTypeFilter] = useState([]);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [ageDayFilter, setAgeDayFilter] = useState('');

  // Filtered notifications strictly for the email modal
  const emailFilteredNotifications = useMemo(() => {
    let result = notifications.filter(n => {
      const rawUnit = String(n.workCtr ?? '').trim().toUpperCase();
      return rawUnit.startsWith('MR') || rawUnit.startsWith('MS');
    });

    if (emailActiveTypeFilter.length > 0) {
      const selectedValues = emailActiveTypeFilter.map((item) => item.value);
      result = result.filter((n) =>
        selectedValues.includes(
          String(n.type ?? '').trim().toUpperCase().replace(/\s+/g, '')
        )
      );
    }

    if (startDateFilter || endDateFilter || ageDayFilter) {
      const today = new Date();
      
      result = result.filter(n => {
        let passDate = true;
        let passAge = true;
        const notifDate = n.notifDate && n.notifDate !== 'N/A' ? new Date(n.notifDate) : null;
        
        if (notifDate && !isNaN(notifDate)) {
          if (startDateFilter) {
            passDate = passDate && (notifDate >= new Date(startDateFilter));
          }
          if (endDateFilter) {
            passDate = passDate && (notifDate <= new Date(endDateFilter));
          }
          
          if (ageDayFilter) {
            const ageDays = Math.floor((today - notifDate) / (1000 * 60 * 60 * 24));
            passAge = ageDays >= parseInt(ageDayFilter, 10);
          }
        } else {
          passDate = false;
        }
        
        return passDate && passAge;
      });
    }

    return result;
  }, [notifications, emailActiveTypeFilter, startDateFilter, endDateFilter, ageDayFilter]);

  const emailGroups = useMemo(() => {
    const groups = {};
    emailFilteredNotifications.forEach(notif => {
      const type = String(notif.type ?? '').trim().toUpperCase();
      const rawUnit = String(notif.workCtr ?? '').trim().toUpperCase();
      const status = String(notif.status ?? '').trim().toUpperCase();
      let prefix = ''; let plantName = rawUnit;
      if (rawUnit.startsWith('MR') || rawUnit.startsWith('MS')) {
        prefix = rawUnit.substring(0, 2);
        plantName = rawUnit.substring(2).trim();
      }
      const plantConfig = emailConfig.find(p => p.plantName.toUpperCase() === plantName);
      if (plantConfig) {
        const isProcessType = ['M1', 'M2', 'M6'].includes(type);
        const isProcessStatus = status === 'PENDING' || status.includes('APRE') || status.includes('JBCO');
        let targetEmail = '';
        if (isProcessType && isProcessStatus) targetEmail = plantConfig.processEmail;
        else if (prefix === 'MR') targetEmail = plantConfig.rotaryMail;
        else if (prefix === 'MS') targetEmail = plantConfig.staticMail;
        else targetEmail = plantConfig.processEmail || plantConfig.rotaryMail || plantConfig.staticMail;

        if (targetEmail) {
          if (!groups[targetEmail]) groups[targetEmail] = [];
          groups[targetEmail].push(notif.id);
        }
      }
    });
    return groups;
  }, [emailFilteredNotifications]);

  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Send Notifications
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Filter and send emails for matching notifications.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Date Range</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200" 
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    title="Start Date"
                  />
                  <span className="text-slate-400">-</span>
                  <input 
                    type="date" 
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200" 
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    title="End Date"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Age (Older than X days)</label>
                <input 
                  type="number" 
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200" 
                  placeholder="e.g. 15"
                  value={ageDayFilter}
                  onChange={(e) => setAgeDayFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Notification Type</label>
                <Select
                  isMulti
                  options={ALL_TYPES.map(t => ({ value: t, label: t }))}
                  value={emailActiveTypeFilter}
                  onChange={(selected) => setEmailActiveTypeFilter(selected || [])}
                  placeholder="Filter types..."
                  className="text-sm"
                  styles={{
                    control: (base) => ({ ...base, minHeight: '46px', borderRadius: '14px', borderColor: '#e2e8f0', boxShadow: 'none' }),
                    multiValue: (base) => ({ ...base, borderRadius: '10px', backgroundColor: '#eef2ff' }),
                    multiValueLabel: (base) => ({ ...base, color: '#4f46e5', fontWeight: 700 }),
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">
                  Matching Notifications:
                </span>
                <span className="text-sm font-bold text-indigo-600 px-2 py-1 bg-indigo-100 rounded-lg">
                  {emailFilteredNotifications.length}
                </span>
              </div>
              
              {Object.keys(emailGroups).length > 0 && (
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 max-h-48 overflow-y-auto">
                  <h4 className="text-sm font-bold text-indigo-900 mb-2">Recipient Preview</h4>
                  <ul className="space-y-2">
                    {Object.entries(emailGroups).map(([email, ids]) => (
                      <li key={email} className="text-xs flex justify-between items-start gap-2 border-b border-indigo-100/50 pb-2 last:border-0 last:pb-0">
                        <span className="font-semibold text-indigo-700 break-all">{email}</span>
                        <span className="text-slate-500 whitespace-nowrap bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                          {ids.length} notif{ids.length !== 1 ? 's' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => {
                   if (emailFilteredNotifications.length === 0) {
                     alert("There are 0 matching notifications. Please adjust your filters or re-upload the Excel file to refresh the data.");
                     return;
                   }
                   
                   const targetEmails = Object.keys(emailGroups);
                   if (targetEmails.length === 0) {
                     alert("No matching emails found for current filters.");
                     return;
                   }

                   console.log("=== Grouped Email Mapping ===");
                   console.log("The following emails would receive these notifications:");
                   Object.entries(emailGroups).forEach(([email, ids]) => {
                     console.log(`Email: ${email} -> Notification IDs:`, ids);
                   });
                   console.log("===============================");
                   
                   const to = targetEmails.join(',');
                   const subject = `Filtered Notifications Alert`;
                   
                   let bodyStr = `Hello,\n\nPlease review the following notifications based on your filters:\n\n`;
                   Object.entries(emailGroups).forEach(([email, ids]) => {
                     bodyStr += `[For ${email}]: ${ids.join(', ')}\n`;
                   });
                   bodyStr += `\nThank you.`;
                   
                   const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyStr)}`;
                   
                   // Try to copy to clipboard as fallback
                   try {
                     navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${bodyStr}`);
                     alert("Email content copied to clipboard! Opening your mail client...");
                   } catch (err) {
                     console.error("Failed to copy", err);
                   }
                   
                   // Attempt to open email client
                   window.location.href = mailtoLink;
                }}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-white transition-all ${emailFilteredNotifications.length === 0 ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Send Grouped Email
              </button>
            </div>
          </div>
        </div>
  );
};

export default SendEmailModal;
