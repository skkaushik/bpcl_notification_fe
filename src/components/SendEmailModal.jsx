import { useState, useMemo, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import NotificationTypeFilter from './NotificationTypeFilter';
import { emailConfig } from '../data/emailConfig';
import { Mail } from "lucide-react";

const SendEmailModal = ({ isOpen, onClose, notifications }) => {
  const [emailActiveTypeFilter, setEmailActiveTypeFilter] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const datePickerRef = useRef(null);
  const [startDateFilter, endDateFilter] =
    dateRange;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

    if (startDateFilter || endDateFilter) {

      result = result.filter(n => {
        let passDate = true;
        let passAge = true;
        const notifDate = n.notifDate && n.notifDate !== 'N/A' ? new Date(n.notifDate) : null;

        if (notifDate && !isNaN(notifDate)) {
          if (startDateFilter) {
            const start = new Date(startDateFilter);
            start.setHours(0, 0, 0, 0);
            passDate =
              passDate &&
              notifDate >= start;
          }
          if (endDateFilter) {
            const end = new Date(endDateFilter);
            end.setHours(23, 59, 59, 999);
            passDate =
              passDate &&
              notifDate <= end;
          }
        } else {
          passDate = false;
        }

        return passDate && passAge;
      });
    }

    return result;
  }, [notifications, emailActiveTypeFilter, startDateFilter, endDateFilter]);

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
        const isProcessStatus = status === 'PENDING' || status.includes('APRE') || status.includes('JBCO') || status.includes('JBPR');
        let targetEmail = '';
        if (isProcessType && isProcessStatus) targetEmail = plantConfig.processEmail;
        else if (prefix === 'MR') targetEmail = plantConfig.rotaryMail;
        else if (prefix === 'MS') targetEmail = plantConfig.staticMail;
        else targetEmail = plantConfig.processEmail || plantConfig.rotaryMail || plantConfig.staticMail;

        if (targetEmail) {
          if (!groups[targetEmail]) groups[targetEmail] = [];
          groups[targetEmail].push(notif);
        }
      }
    });
    return groups;
  }, [emailFilteredNotifications]);

  const handleSendEmail = async () => {
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
    Object.entries(emailGroups).forEach(([email, notifs]) => {
      console.log(`Email: ${email} -> Notification IDs:`, notifs.map(n => n.id));
    });
    console.log("===============================");

    const subject = `Filtered Notifications Alert`;

    // Send individual emails to each recipient with their specific notifications
    const emailsToOpen = [];
    
    Object.entries(emailGroups).forEach(([email, notifs]) => {
      // Build body for this specific email recipient
      let bodyStr = `FILTERED NOTIFICATION ALERT\n\n`;
      bodyStr += `Dear Team,\n\n`;
      bodyStr += `Please find below the notifications assigned to you:\n\n`;
      bodyStr += `=================================================\n`;
      bodyStr += `Notification Count: ${notifs.length}\n`;
      bodyStr += `=================================================\n\n`;
      bodyStr += `Notification\tType\tStatus\tWorkCtr\tDate\n`;
      bodyStr += `---------------------------------------------------------\n`;

      notifs.forEach((n) => {
        bodyStr += `${n.id}\t${n.type}\t${n.status}\t${n.workCtr}\t${String(n.notifDate)}\n`;
      });

      bodyStr += `\n=================================================\n`;
      bodyStr += `Thank you.\n`;
      bodyStr += `\nBest Regards,\nNotification System`;

      // Create mailto link - use proper encoding for Outlook compatibility
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(bodyStr);
      
      const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
      
      emailsToOpen.push({
        url: mailtoUrl,
        recipient: email
      });
    });

    // Open all mailto links with slight delays for better Outlook compatibility
    let delayTime = 0;
    emailsToOpen.forEach((emailObj) => {
      setTimeout(() => {
        try {
          window.open(emailObj.url, '_blank');
        } catch (error) {
          console.error(`Error opening mailto for ${emailObj.recipient}:`, error);
        }
      }, delayTime);
      delayTime += 800; // 800ms delay between each email to ensure Outlook opens separate drafts
    });

    onClose();
    alert(`Opening ${targetEmails.length} email(s). Check your email client (Gmail, Outlook, etc.). If nothing opens, you may need to manually copy-paste the email addresses.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Date Range
            </label>
            <div className="relative w-full">
              <DatePicker
                ref={datePickerRef}
                selectsRange
                startDate={startDateFilter}
                endDate={endDateFilter}
                onChange={(update) => {
                  setDateRange(update);
                }}
                maxDate={new Date()}
                dateFormat="dd-MM-yyyy"
                placeholderText="dd-mm-yyyy - dd-mm-yyyy"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-3 pr-20 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                isClearable
                wrapperClassName="w-full"
                portalId="root-portal"
                popperClassName="!z-[9999]"
              />

              <button
                type="button"
                onClick={() => {
                  datePickerRef.current?.setOpen(true);
                }}
                className="absolute inset-y-0 right-9 flex items-center pr-4 text-slate-400 transition hover:text-indigo-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-bold uppercase tracking-wide text-slate-800 mr-2">
                Notification Type:
              </span>
              <NotificationTypeFilter
                value={emailActiveTypeFilter}
                onChange={setEmailActiveTypeFilter}
              />
            </div>
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
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 max-h-[30vh] overflow-y-auto shadow-inner">
              <table className="min-w-full divide-y divide-indigo-200 text-xs">
                <thead className="bg-indigo-100/80 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-indigo-900">Email</th>
                    <th className="px-4 py-3 text-left font-bold text-indigo-900">Type</th>
                    <th className="px-4 py-3 text-left font-bold text-indigo-900">Status</th>
                    <th className="px-4 py-3 text-left font-bold text-indigo-900">WorkCtr</th>
                    <th className="px-4 py-3 text-left font-bold text-indigo-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100 bg-white">
                  {Object.entries(emailGroups).map(([email, notifs]) => (
                    notifs.map((notif, idx) => (
                      <tr key={`${email}-${notif.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 text-indigo-700 font-semibold truncate max-w-[200px]" title={email}>{email}</td>
                        <td className="px-4 py-2 text-slate-700 font-medium">{notif.type}</td>
                        <td className="px-4 py-2 text-slate-700">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {notif.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-700 font-medium">{notif.workCtr}</td>
                        <td className="px-4 py-2 text-slate-700">{notif.notifDate || 'N/A'}</td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleSendEmail}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white hover:bg-indigo-700"
          >
            <Mail className="h-5 w-5" />
            Send Grouped Email
          </button>
          {/* <button
            onClick={handleSendEmail}
            disabled={isSending}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-white transition-all ${emailFilteredNotifications.length === 0 ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isSending ? (
  <>
    <LoaderCircle className="h-5 w-5 animate-spin" />
    Sending...
  </>
) : (
  <>
    <Mail className="h-5 w-5" />
    Send Grouped Email
  </>
)}
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;
