import Layout from "../../components/Layout";
import NotificationTypeBarChart from "../../components/NotificationTypeBarChart";
import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
const normalizeKey = (key = "") => String(key).replace(/\s+/g, "").toLowerCase();
const findKey = (row = {}, targets = []) => {
  const keyMap = Object.keys(row).reduce((map, key) => {
    map[normalizeKey(key)] = key;
    return map;
  }, {});
  for (const t of targets) {
    const found = keyMap[normalizeKey(t)];
    if (found) return found;
  }
  return undefined;
};
const calculateKpiStats = (data = []) => {
  const total = Array.isArray(data) ? data.length : 0;
  const defaults = {
  totalNotifications: '0',
  notif15Days: '0',
  m2Pending: '0',
  m1Pending: '0',
  overdue: '0',
  impactedUnits: '0',
};
  if (total === 0) return defaults;
  const sample = data[0] || {};
  const typeKey = findKey(sample, [
  'Type',
  'Notification Type',
  'Notif Type',
  'NotificationType',
]);
const notifDateKey = findKey(sample, [
  'Notif.date',
  'Notification Date',
  'Date',
]);

const requiredEndKey = findKey(sample, [
  'Required End',
  'RequiredEnd',
]);

const unitKey = findKey(sample, [
  'Main WorkCtr',
  'MainWorkCtr',
  'Unit',
]);

const statusKey = findKey(sample, [
  'Status',
  'User status',
]);

const today = new Date();

const diffDays = (dateValue) => {

  if (!dateValue) return 0;

  const d = new Date(dateValue);

  if (isNaN(d)) return 0;

  return Math.floor(
    (today - d) / (1000 * 60 * 60 * 24)
  );
};

const notif15Days = data.filter((row) => {
  return diffDays(row[notifDateKey]) > 15;
}).length;

const m2Pending = data.filter((row) => {

  const type = String(
    row[typeKey] ?? ''
  ).trim().toUpperCase();

  return (
    type === 'M2' &&
    diffDays(row[notifDateKey]) > 7
  );

}).length;

const m1Pending = data.filter((row) => {

  const type = String(
    row[typeKey] ?? ''
  ).trim().toUpperCase();

  return (
    type === 'M1' &&
    diffDays(row[notifDateKey]) > 25
  );

}).length;

const overdue = data.filter((row) => {

  const value = row[requiredEndKey];

  // Ignore only visible blank cells
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return false;
  }
  let requiredDate;
  // If already Date object
  if (value instanceof Date) {
    requiredDate = value;
  }
  // If Excel serial number
  else if (typeof value === 'number') {

    requiredDate = new Date(
      (value - 25569) * 86400 * 1000
    );
  }
  // If string date
  else {
    requiredDate = new Date(
      String(value).trim()
    );
  }
  // Ignore invalid dates
  if (isNaN(requiredDate)) {
    return false;
  }
  return requiredDate < today;
}).length;
const unitSet = new Set();
data.forEach((row) => {
  const val = String(
    row[unitKey] ?? ''
  ).trim();
  if (val) unitSet.add(val);
});
const impactedUnits = unitSet.size;
 return {
  totalNotifications: String(total),
  notif15Days: String(notif15Days),
  m2Pending: String(m2Pending),
  m1Pending: String(m1Pending),
  overdue: String(overdue),
  impactedUnits: String(impactedUnits),
};
};
const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [stats, setStats] = useState({
  totalNotifications: '0',
  notif15Days: '0',
  m2Pending: '0',
  m1Pending: '0',
  overdue: '0',
  impactedUnits: '0',
});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [unitPerformance, setUnitPerformance] = useState([
    { name: 'Unit 1', val: 85, color: 'bg-indigo-600' },
    { name: 'Unit 2', val: 62, color: 'bg-amber-500' },
    { name: 'Unit 4', val: 94, color: 'bg-emerald-500' },
  ]);
  const paginatedNotifications =
  notifications.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
const totalPages = Math.ceil(
  notifications.length / rowsPerPage
);
  const fileInputRef = useRef(null);
  const prevRawSignature = useRef('');
  useEffect(() => {
    // update stats only when rawData content changes (avoid unnecessary setState)
    const signature = rawData.length + '|' + (rawData[0] ? Object.keys(rawData[0]).join(',') : '');
    if (prevRawSignature.current !== signature) {
      const newStats = calculateKpiStats(rawData);
      setStats((prev) => {
        const p = JSON.stringify(prev);
        const n = JSON.stringify(newStats);
        return p === n ? prev : newStats;
      });
      prevRawSignature.current = signature;
    }
  }, [rawData]);

  const colorStyles = {
    indigo: { badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-600', badgeRing: 'ring-indigo-600/10', dot: 'bg-indigo-600' },
    rose: { badgeBg: 'bg-rose-50', badgeText: 'text-rose-700', badgeRing: 'ring-rose-600/10', dot: 'bg-rose-600' },
    amber: { badgeBg: 'bg-amber-50', badgeText: 'text-amber-600', badgeRing: 'ring-amber-600/10', dot: 'bg-amber-600' },
    emerald: { badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600', badgeRing: 'ring-emerald-600/10', dot: 'bg-emerald-600' },
    cyan: { badgeBg: 'bg-cyan-50', badgeText: 'text-cyan-600', badgeRing: 'ring-cyan-600/10', dot: 'bg-cyan-600' },
  };

  const handleFileUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setSelectedFile(file);
};
const processUploadedFile = () => {
  if (!selectedFile) return;
  setUploadLoading(true);
  setUploadMessage("Uploading file...");
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = event.target?.result;
      const workbook = XLSX.read(data, {
        type: 'array',
      });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      setUploadMessage("Processing Excel data...");
      const jsonData = XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: '',
        }
      );
      if (!jsonData || jsonData.length === 0) {
        throw new Error('Empty file');
      }
      const sample = jsonData[0] || {};

const notificationKey = findKey(sample, [
  'Notification',
  'Notification No',
  'Notification Number',
]);

const equipmentKey = findKey(sample, [
  'Equipment',
  'Equipment Name',
  'Equip',
]);

const statusKey = findKey(sample, [
  'Status',
  'User status',
]);

const typeKey = findKey(sample, [
  'Type',
  'Notification Type',
]);

const workCtrKey = findKey(sample, [
  'Main WorkCtr',
]);

const requiredEndKey = findKey(sample, [
  'Required End',
]);

const notifDateKey = findKey(sample, [
  'Notif.date',
]);

const priorityKey = findKey(sample, [
  'Priority',
]);
      // KEEP YOUR EXISTING LOGIC SAME
     const updatedNotifications = jsonData
  .filter((row) => {

    const notificationKey = findKey(row, [
      'Notification',
      'Notification No',
      'Notification Number',
    ]);

    return row[notificationKey];

  })
  .map((row, idx) => {

return {

  id:
    row[notificationKey] ||
    `N-${idx + 1}`,

  equip:
    row[equipmentKey] ||
    'Unknown equipment',

  status: (() => {

  const rawStatus = String(
    row[statusKey] || ''
  ).toUpperCase();

  if (rawStatus.includes('APRD'))
    return 'Approved';

  if (rawStatus.includes('APRE'))
    return 'Pending';

  if (rawStatus.includes('NOPR'))
    return 'In Progress';

  return rawStatus || 'Pending';

})(),

  type:
    row[typeKey] || 'N/A',

  workCtr:
    row[workCtrKey] || 'N/A',

  requiredEnd:
    row[requiredEndKey] || 'N/A',

  notifDate:
    row[notifDateKey] || 'N/A',

  priority:
    row[priorityKey] || 'Normal',

  color: [
    'rose',
    'indigo',
    'emerald',
    'amber',
  ][idx % 4],

};
      });
      setUploadMessage("Updating dashboard...");
      setNotifications(updatedNotifications);
      setCurrentPage(1);
      setRawData(jsonData);
      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadLoading(false);
      setUploadMessage("Dashboard updated successfully!");
setTimeout(() => {
  setUploadMessage("");
}, 2500);
    } catch (err) {
      console.error(err);
      setUploadLoading(false);
      setUploadMessage("Error uploading file!");
    }
  };
  reader.readAsArrayBuffer(selectedFile);
};
  return (
    <Layout>
      {/* Breadcrumbs & Actions */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Machine Overview</h2>
          <p className="mt-1 text-slate-500 font-medium">Real-time monitoring for Unit 4 • Steel Plant</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            Upload File
          </button>
        </div>
      </div>
      {rawData.length > 0 ? (
        <>
      {/* KPI Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[     
  {
    label: 'Total Notifications',
    value: stats.totalNotifications,
    detail: 'Open / pending',
    color: 'indigo',
  },
  {
    label: 'Notif > 15 days',
    value: stats.notif15Days,
    detail: 'Older notifications',
    color: 'rose',
  },
  {
    label: 'M2 pending > 7 d',
    value: stats.m2Pending,
    detail: 'Pending overdue',
    color: 'amber',
  },
  {
    label: 'M1 pending > 25 d',
    value: stats.m1Pending,
    detail: 'Critical pending',
    color: 'cyan',
  },
  {
    label: 'Due / overdue',
    value: stats.overdue,
    detail: 'Past required end',
    color: 'rose',
  },
  {
    label: 'Units impacted',
    value: stats.impactedUnits,
    detail: 'Unique locations',
    color: 'emerald',
  },
        ].map((stat) => (
          <div key={stat.label} className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <p className="text-s font-bold uppercase tracking-widest text-slate-600">{stat.label}</p>
            <div className="mt-4 flex items-end justify-between">
              <h3 className={`text-3xl font-bold text-slate-900`}>{stat.value}</h3>
              <span className={`text-xs font-normal px-2 py-1 rounded-lg ${colorStyles[stat.color].badgeBg} ${colorStyles[stat.color].badgeText}`}>
                {stat.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <NotificationTypeBarChart data={rawData} />
      </div>
      {/* Main Content Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Table Section */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Live Notification Stream</h3>
            <button className="text-sm font-bold text-indigo-600">View All</button>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="max-h-[560px] overflow-y-auto pr-1">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="pb-4">Notification</th>
                    <th className="pb-4">Equipment</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                 {paginatedNotifications.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5">
                        <p className="text-sm font-bold text-slate-900">{row.id}</p>
                        <p className="text-xs font-medium text-slate-400">
                           {row.type} • {String(row.notifDate)}
                        </p>
                      </td>
                      <td className="py-5">
                        <p className="text-sm font-semibold text-slate-700">{row.equip}</p>
                      </td>
                      <td className="py-5">
                        {(() => {
                          const badge = colorStyles[row.color] || colorStyles.indigo;
                          return (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${badge.badgeBg} ${badge.badgeText} ${badge.badgeRing}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                              {row.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-5 text-right">
                        <button
                       onClick={() => setSelectedNotification(row)}
                       className="rounded-lg px-3 py-1 text-xs font-bold text-slate-400 border border-slate-200 group-hover:bg-white group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                        Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table><div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
  <p className="text-sm text-slate-500">
    Showing{" "}
    {notifications.length === 0
      ? 0
      : (currentPage - 1) * rowsPerPage + 1}
    -
    {Math.min(
      currentPage * rowsPerPage,
      notifications.length
    )}{" "}
    of {notifications.length}
  </p>
  <div className="flex items-center gap-2">
    <button
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage((p) => p - 1)
      }
      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Previous
    </button>
    <div className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-600">
      {currentPage}
    </div>
    <button
      disabled={
        currentPage === totalPages ||
        totalPages === 0
      }
      onClick={() =>
        setCurrentPage((p) => p + 1)
      }
      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Next
    </button>
  </div>
</div>
            </div>
          </div>
        </div>
        {/* Analytics Side Section */}
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Unit Performance</h3>
            <div className="space-y-5">
              {unitPerformance.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="text-slate-400">{item.val}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
</>
     ) : (
      <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-gray-100 px-10 py-24 text-center shadow-sm">
  {/* Icon */}
  <div className="mb-6 rounded-full bg-indigo-100 p-6 text-5xl">
    📊
  </div>
  {/* Heading */}
  <h2 className="text-3xl font-bold text-slate-900">
    No Analytics Available
  </h2>
  {/* Description */}
  <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-800">
    Upload an Excel file to start analytics,
    generate KPIs, visualize charts,
    and monitor machine notifications.
  </p>
  {/* Upload Button */}
  <button
    onClick={() => setShowUploadDialog(true)}
    className="mt-8 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
  >
    Upload Excel File
  </button>
  {/* Features */}
  <div className="mt-10 grid gap-4 text-sm text-slate-400 sm:grid-cols-3">
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
      📈 KPI Metrics
    </div>

    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
      📊 Charts & Analytics
    </div>

    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
      🔔 Notification Tables
    </div>
  </div>
</div>
)  
}
{selectedNotification && (

  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

    <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-slate-900">
            Notification Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Detailed information about selected notification
          </p>

        </div>

        <button
          onClick={() =>
            setSelectedNotification(null)
          }
          className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200"
        >
          ✕
        </button>

      </div>

      {/* Content */}

      <div className="grid gap-5 sm:grid-cols-2">

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Notification ID
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {selectedNotification.id}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Equipment
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {selectedNotification.equip}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Status
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {selectedNotification.status}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Priority
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
           {selectedNotification.priority}
          </p>

        </div>

      </div>
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">

  <span className="text-sm font-bold text-slate-500">
    Type
  </span>

  <span className="text-sm font-bold text-slate-900">
    {selectedNotification.type}
  </span>

</div>

<div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">

  <span className="text-sm font-bold text-slate-500">
    WorkCtr
  </span>

  <span className="text-sm font-bold text-slate-900">
    {selectedNotification.workCtr}
  </span>

</div>

<div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">

  <span className="text-sm font-bold text-slate-500">
    Required End
  </span>

  <span className="text-sm font-bold text-slate-900">
    {String(selectedNotification.requiredEnd)}
  </span>

</div>

      {/* Footer */}

      <div className="mt-8 flex justify-end">

        <button
          onClick={() =>
            setSelectedNotification(null)
          }
          className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Close
        </button>

      </div>

    </div>

  </div>

)}
      {/* Upload Dialog Modal */}
      {showUploadDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900">
          Upload Data File
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Upload Excel file for dashboard analytics
        </p>
      </div>
      {/* Upload Area */}
      <div className="mb-5">
        <div
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
        >
          <svg
            className="mx-auto mb-3 h-12 w-12 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm font-bold text-slate-900">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Excel files (.xlsx, .xls)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                📄
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-sm font-bold text-rose-500 hover:text-rose-600"
            >
              Remove
            </button>
          </div>
        </div>
      )}
      {uploadMessage && (
  <div
    className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
      uploadLoading
        ? "bg-indigo-50 text-indigo-700"
        : uploadMessage.includes("success")
        ? "bg-emerald-50 text-emerald-700"
        : "bg-rose-50 text-rose-700"
    }`}
  >
    {uploadMessage}
  </div>
)}
      {/* Buttons */}
      <div className="flex gap-3">
       <button
       disabled={uploadLoading}
          onClick={() => {
            if (!selectedFile) {
              fileInputRef.current?.click();
            } else {
              processUploadedFile();
            }
          }}
          className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all"
        >
          {uploadLoading
  ? "Processing..."
  : selectedFile
  ? "Upload to Dashboard"
  : "Select File"}
        </button>
        <button
          onClick={() =>
            setShowUploadDialog(false)
          }
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
    </Layout>
  );
};
export default Dashboard;
