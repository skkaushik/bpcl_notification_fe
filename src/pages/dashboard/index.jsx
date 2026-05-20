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
    totalLabel: 'Live Data',
    criticalAlerts: '0',
    criticalLabel: 'Live Data',
    activeUnits: '00',
    activeLabel: 'Units detected',
    uptime: '0.0%',
    uptimeLabel: 'Calculated',
  };

  if (total === 0) return defaults;

  const sample = data[0] || {};
  const priorityKey = findKey(sample, ['Priority', 'Priority Level', 'Severity', 'Status']);
  const statusKey = findKey(sample, ['Status']);
  const unitKey = findKey(sample, ['Units', 'Unit', 'Functional Location', 'Unit Name', 'FunctionalLocation']);
  const equipmentKey = findKey(sample, ['Equipment', 'Equipment Name', 'Equip']);
  const breakdownKey = findKey(sample, ['Breakdown', 'Breakdown?', 'Is Breakdown', 'Breakdown Status']);
  const compareKey = findKey(sample, ['Previous Total', 'Prior Total', 'Last Period', 'Comparison', 'Change']);

  const criticalMatches = ['1', 'high', 'critical', 'emergency'];
  const criticalAlerts = data.filter((row) => {
    const raw = String(row[priorityKey] ?? row[statusKey] ?? '').trim().toLowerCase();
    return criticalMatches.includes(raw);
  }).length;

  const unitSet = new Set();
  data.forEach((row) => {
    let unitVal = String(row[unitKey] ?? row[equipmentKey] ?? '').trim();
    const m = unitVal.match(/Unit\s*(\d+)/i);
    if (m) unitVal = `Unit ${m[1]}`;
    if (unitVal) unitSet.add(unitVal);
  });
  const activeUnits = unitSet.size > 0 ? String(unitSet.size).padStart(2, '0') : '00';

  const activeSystems = data.filter((row) => {
    const br = String(row[breakdownKey] ?? '').trim().toLowerCase();
    return br === '' || br === 'no';
  }).length;

  const uptime = total > 0 ? `${((activeSystems / total) * 100).toFixed(1)}%` : '0.0%';

  const totalLabel = (() => {
    if (!compareKey) return 'Live Data';
    const compareValue = parseFloat(data[0][compareKey]);
    if (Number.isNaN(compareValue) || compareValue <= 0) return 'Live Data';
    const diff = total - compareValue;
    const percent = ((diff / compareValue) * 100).toFixed(1);
    return diff >= 0 ? `+${percent}%` : `${percent}%`;
  })();

  return {
    totalNotifications: String(total),
    totalLabel,
    criticalAlerts: String(criticalAlerts),
    criticalLabel: 'Live Data',
    activeUnits,
    activeLabel: 'Units detected',
    uptime,
    uptimeLabel: 'Calculated',
  };
};

const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [stats, setStats] = useState({
    totalNotifications: '0',
    totalLabel: 'Live Data',
    criticalAlerts: '0',
    criticalLabel: 'Live Data',
    activeUnits: '00',
    activeLabel: 'Units detected',
    uptime: '0.0%',
    uptimeLabel: 'Calculated',
  });
  const [unitPerformance, setUnitPerformance] = useState([
    { name: 'Unit 1', val: 85, color: 'bg-indigo-600' },
    { name: 'Unit 2', val: 62, color: 'bg-amber-500' },
    { name: 'Unit 4', val: 94, color: 'bg-emerald-500' },
  ]);

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

  const reader = new FileReader();

  reader.onload = (event) => {
    try {

      const data = event.target?.result;

      const workbook = XLSX.read(data, {
        type: 'array',
      });

      const sheetName = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: '',
        }
      );

      if (!jsonData || jsonData.length === 0) {
        throw new Error('Empty file');
      }

      // KEEP YOUR EXISTING LOGIC SAME
      const updatedNotifications = jsonData.map((row, idx) => {

        const notificationKey = findKey(row, [
          'Notification',
          'ID',
        ]);

        const equipmentKey = findKey(row, [
          'Equipment',
          'Equipment Name',
          'Equip',
        ]);

        const statusKey = findKey(row, [
          'Status',
        ]);

        return {
          id:
            row[notificationKey] ||
            `N-${idx + 1}`,

          equip:
            row[equipmentKey] ||
            'Unknown equipment',

          status:
            row[statusKey] || 'Pending',

          color: [
            'rose',
            'indigo',
            'emerald',
            'amber',
          ][idx % 4],
        };
      });

      setNotifications(updatedNotifications);

      setRawData(jsonData);

      setShowUploadDialog(false);

      setSelectedFile(null);

    } catch (err) {

      console.error(err);

      alert('Error reading file');
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

      {/* KPI Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Notifications', value: stats.totalNotifications, detail: stats.totalLabel, color: 'indigo' },
          { label: 'Critical Alerts', value: stats.criticalAlerts, detail: stats.criticalLabel, color: 'rose' },
          { label: 'Active Units', value: stats.activeUnits, detail: stats.activeLabel, color: 'amber' },
          { label: 'System Uptime', value: stats.uptime, detail: stats.uptimeLabel, color: 'emerald' },
        ].map((stat) => (
          <div key={stat.label} className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <div className="mt-4 flex items-end justify-between">
              <h3 className={`text-4xl font-black text-slate-900`}>{stat.value}</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${colorStyles[stat.color].badgeBg} ${colorStyles[stat.color].badgeText}`}>
                {stat.detail}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <NotificationTypeBarChart data={rawData} />
      </div>

      {/* Modern Filter Bar */}
      {/* <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {['All Types', 'Mechanical', 'Electrical', 'Operational'].map((f, i) => (
            <button key={f} className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${i === 0 ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              {f}
            </button>
          ))}
          <div className="ml-auto flex gap-2 pr-2">
             <button className="p-2 text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg></button>
          </div>
        </div>
      </div> */}

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
                  {notifications.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5">
                        <p className="text-sm font-bold text-slate-900">{row.id}</p>
                        <p className="text-xs font-medium text-slate-400">Mech • 12 Oct</p>
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
                        <button className="rounded-lg px-3 py-1 text-xs font-bold text-slate-400 border border-slate-200 group-hover:bg-white group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-xl shadow-indigo-200">
            <h3 className="text-lg font-bold">Need Maintenance?</h3>
            <p className="mt-2 text-sm text-indigo-100 leading-relaxed">You have 14 predictive maintenance tasks scheduled for this weekend.</p>
            <button className="mt-6 w-full rounded-xl bg-white py-3 text-sm font-bold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors">
              Review Schedule
            </button>
          </div>
        </div>
      </div>

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

      {/* Buttons */}
      <div className="flex gap-3">

        <button
          onClick={() => {
            if (!selectedFile) {
              fileInputRef.current?.click();
            } else {
              processUploadedFile();
            }
          }}
          className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all"
        >
          {selectedFile
            ? 'Upload to Dashboard'
            : 'Select File'}
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
