import React from 'react';

const NotificationDetailsModal = ({ selectedNotification, setSelectedNotification }) => {
  if (!selectedNotification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-normal text-slate-900">
              Notification Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Detailed information about selected notification
            </p>
          </div>
          <button
            onClick={() => setSelectedNotification(null)}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold tracking-widest text-slate-400">
              Notification ID
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {selectedNotification.id}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold tracking-widest text-slate-400">
              Equipment
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {selectedNotification.equip}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold tracking-widest text-slate-400">
              Status
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {selectedNotification.status}
            </p>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 mt-5">
              <p className="text-xs font-bold tracking-widest text-slate-400">
                Priority
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {selectedNotification.priority}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 mt-5">
          <span className="text-sm font-bold text-slate-500">Type</span>
          <span className="text-sm font-bold text-slate-900">
            {selectedNotification.type}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
          <span className="text-sm font-bold text-slate-500">WorkCtr</span>
          <span className="text-sm font-bold text-slate-900">
            {selectedNotification.workCtr}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
          <span className="text-sm font-bold text-slate-500">Required End</span>
          <span className="text-sm font-bold text-slate-900">
            {String(selectedNotification.requiredEnd)}
          </span>
        </div>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={() => setSelectedNotification(null)}
            className="rounded-2xl bg-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailsModal;
