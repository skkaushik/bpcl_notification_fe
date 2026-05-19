import Layout from "../../components/Layout";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";

const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'N-2023-124', equip: 'Blast Furnace Pump', status: 'Critical', color: 'rose' },
    { id: 'N-2023-125', equip: 'Static Panel B2', status: 'In Progress', color: 'indigo' },
    { id: 'N-2023-128', equip: 'Rotary Crane Unit 4', status: 'Resolved', color: 'emerald' },
    { id: 'N-2023-130', equip: 'Main Gearbox', status: 'Overdue', color: 'amber' },
  ]);
  const [stats, setStats] = useState({
    totalNotifications: '1,284',
    criticalAlerts: '42',
    activeUnits: '08',
    uptime: '99.8%'
  });
  const [unitPerformance, setUnitPerformance] = useState([
    { name: 'Unit 1', val: 85, color: 'bg-indigo-600' },
    { name: 'Unit 2', val: 62, color: 'bg-amber-500' },
    { name: 'Unit 4', val: 94, color: 'bg-emerald-500' },
  ]);
  const fileInputRef = useRef(null);

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

    const getHeaderKey = (row, target) => {
      const normalized = target.replace(/\s+/g, '').toLowerCase();
      return Object.keys(row).find(key => key.replace(/\s+/g, '').toLowerCase() === normalized);
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          throw new Error('Empty file');
        }

        const updatedNotifications = jsonData.map((row, idx) => {
          const notificationKey = getHeaderKey(row, 'Notification') || getHeaderKey(row, 'ID');
          const equipmentKey = getHeaderKey(row, 'Equipment') || getHeaderKey(row, 'Equipment Name');
          const statusKey = getHeaderKey(row, 'Status');

          return {
            id: row[notificationKey] || `N-${idx + 1}`,
            equip: row[equipmentKey] || 'Unknown equipment',
            status: row[statusKey] || 'Pending',
            color: ['rose', 'indigo', 'emerald', 'amber'][idx % 4],
          };
        });

        setNotifications(updatedNotifications);

        const totalNotifs = updatedNotifications.length;
        const criticalCount = updatedNotifications.filter(n => n.status === 'Critical').length;

        const unitKey = getHeaderKey(jsonData[0], 'Units') || getHeaderKey(jsonData[0], 'Unit') || getHeaderKey(jsonData[0], 'Unit Name');
        const unitList = jsonData
          .map((row) => row[unitKey] || row[getHeaderKey(row, 'Equipment')] )
          .filter(Boolean)
          .map((value) => {
            const match = String(value).match(/Unit\s*(\d+)/i);
            return match ? match[1] : String(value);
          });
        const activeUnitsCount = unitList.length > 0 ? new Set(unitList).size.toString().padStart(2, '0') : '00';

        const uptimeKey = getHeaderKey(jsonData[0], 'Uptime');
        const uptimeValue = uptimeKey
          ? String(jsonData[0][uptimeKey]).includes('%')
            ? String(jsonData[0][uptimeKey])
            : `${jsonData[0][uptimeKey]}%`
          : `${((totalNotifs - criticalCount) / Math.max(totalNotifs, 1) * 100).toFixed(1)}%`;

        setStats({
          totalNotifications: totalNotifs.toString(),
          criticalAlerts: criticalCount.toString(),
          activeUnits: activeUnitsCount,
          uptime: uptimeValue,
        });

        const mainWorkKey = getHeaderKey(jsonData[0], 'Main Work Ctr') || getHeaderKey(jsonData[0], 'MainWorkCtr') || getHeaderKey(jsonData[0], 'Main Work');
        const unitPerfData = [];

        if (mainWorkKey) {
          const perfMap = {};
          jsonData.forEach((row) => {
            const mainWorkValue = parseFloat(row[mainWorkKey]) || 0;
            let unitValue = row[unitKey] || row[getHeaderKey(row, 'Equipment')] || 'Unknown';
            const match = String(unitValue).match(/Unit\s*(\d+)/i);
            unitValue = match ? `Unit ${match[1]}` : String(unitValue).trim() || 'Unknown';

            if (!perfMap[unitValue]) {
              perfMap[unitValue] = 0;
            }
            perfMap[unitValue] += mainWorkValue;
          });

          const totals = Object.values(perfMap);
          const maxTotal = Math.max(...totals, 1);
          const colorList = ['bg-indigo-600', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];
          let colorIndex = 0;

          Object.keys(perfMap)
            .sort()
            .forEach((unit) => {
              const value = perfMap[unit];
              const score = Math.round((value / maxTotal) * 100);
              unitPerfData.push({
                name: unit,
                val: score,
                color: colorList[colorIndex % colorList.length],
              });
              colorIndex++;
            });
        }

        if (unitPerfData.length > 0) {
          setUnitPerformance(unitPerfData);
        }

        setShowUploadDialog(false);
      } catch (error) {
        console.error(error);
        alert('Error reading file. Please ensure it has Notification, Equipment, Status, and Main Work Ctr columns.');
      }
    };

    reader.readAsArrayBuffer(file);
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
          { label: 'Total Notifications', value: stats.totalNotifications, trend: '+12%', color: 'indigo' },
          { label: 'Critical Alerts', value: stats.criticalAlerts, trend: 'High Priority', color: 'rose' },
          { label: 'Active Units', value: stats.activeUnits, trend: '4 Recovered', color: 'amber' },
          { label: 'System Uptime', value: stats.uptime, trend: 'Last 24h', color: 'emerald' },
        ].map((stat) => (
          <div key={stat.label} className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <div className="mt-4 flex items-end justify-between">
              <h3 className={`text-4xl font-black text-slate-900`}>{stat.value}</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${colorStyles[stat.color].badgeBg} ${colorStyles[stat.color].badgeText}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Filter Bar */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
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
      </div>

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Table Section */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Live Notification Stream</h3>
            <button className="text-sm font-bold text-indigo-600">View All</button>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
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
              <h3 className="text-2xl font-bold text-slate-900">Upload Data File</h3>
              <p className="mt-2 text-sm text-slate-500">Upload an Excel file with columns: Notification, Equipment, Status, Main Work Ctr</p>
            </div>

            <div className="mb-6">
              <label className="block">
                <div className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all">
                  <svg className="mx-auto h-12 w-12 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-bold text-slate-900">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-500 mt-1">Excel files (.xlsx, .xls)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all"
              >
                Select File
              </button>
              <button
                onClick={() => setShowUploadDialog(false)}
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