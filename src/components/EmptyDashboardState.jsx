import React from 'react';

const EmptyDashboardState = ({ setShowUploadDialog }) => {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-gray-100 px-10 py-24 text-center shadow-sm">
      <div className="mb-6 rounded-full bg-[#003865]/10 p-6 text-5xl">
        📊
      </div>

      <h2 className="text-3xl font-bold text-slate-900">
        No Analytics Available
      </h2>

      <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-800">
        Upload an Excel file to start analytics,
        generate KPIs, visualize charts,
        and monitor machine notifications.
      </p>

      <button
        onClick={() => setShowUploadDialog(true)}
        className="mt-8 rounded-2xl bg-[#003865] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-[#003865]/20 hover:bg-[#002244] transition-all cursor-pointer"
      >
        Upload Excel File
      </button>

      <div className="mt-10 grid gap-4 text-sm text-slate-400 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
          📈 KPI Metrics
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
          📊 Charts &amp; Analytics
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
          🔔 Notification Tables
        </div>
      </div>
    </div>
  );
};

export default EmptyDashboardState;
