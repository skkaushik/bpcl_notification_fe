
const EquipmentDetailsDrawer = ({
  selectedEquipment,
  setSelectedEquipment
}) => {
  return (
    <div
      className={`absolute top-0 right-0 w-[580px] h-full bg-white border-[#E5E7EB] shadow-lg flex flex-col transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${selectedEquipment
        ? 'translate-x-0 opacity-100 border rounded-[24px]'
        : 'translate-x-[20px] opacity-0 border-0 rounded-none pointer-events-none'
        }`}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex-shrink-0 p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Equipment Details</h2>
            <p className="text-indigo-600 font-extrabold text-lg mt-1 tracking-tight">{selectedEquipment?.displayEquipId}</p>
          </div>
          <button onClick={() => setSelectedEquipment(null)} className="rounded-full bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="relative mt-6 pb-4">
            {/* Center Line */}
            <div className="absolute top-2 bottom-0 left-1/2 w-0.5 bg-slate-200 -translate-x-1/2"></div>

            <div className="space-y-10">
              {selectedEquipment?.notifications?.slice().sort((a, b) => {
                const parseDate = (dStr) => {
                  if (!dStr) return 0;
                  const parts = dStr.split('-');
                  if (parts.length === 3) {
                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
                  }
                  return 0;
                };
                return parseDate(b.displayDate) - parseDate(a.displayDate);
              }).map((notif, idx) => (
                <div key={idx} className="relative flex flex-col items-center">
                  {/* Timeline Dot & Date */}
                  <div className="z-10 relative flex justify-center items-center mb-4 w-full">
                    <div className="w-4 h-4 rounded-full bg-indigo-500 border-[3px] border-white shadow-sm ring-1 ring-slate-200"></div>
                    <span className="absolute left-[calc(50%+16px)] text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50 shadow-sm">
                      {notif.displayDate}
                    </span>
                  </div>

                  {/* Card */}
                  <div className="w-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm relative overflow-hidden transition-shadow hover:shadow-md z-10">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-50"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-0.5">Notification ID</p>
                        <p className="text-lg font-extrabold text-slate-900 tracking-tight">{notif.displayId}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">Notification Type</p>
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                          {notif.displayType}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">System Status</p>
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-600">
                          {notif.displayStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">Unit</p>
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600">
                          {notif.displayUnitName}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">Priority</p>
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-violet-50 text-violet-700">
                          {notif.displayPriority}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-bold text-slate-400 mb-1">Reported By</p>
                      <p className="text-sm font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        {notif.displayReportedBy}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-bold text-slate-400 mb-2">Description</p>
                      <div className="text-sm text-black leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                        {notif.displayDesc1 && notif.displayDesc2 ? (
                          <>
                            <div className="flex items-start">
                              <span className="text-slate-500 mr-2 mt-0.5">•</span>
                              <span>{notif.displayDesc1}</span>
                            </div>
                            <div className="flex items-start">
                              <span className="text-slate-500 mr-2 mt-0.5">•</span>
                              <span>{notif.displayDesc2}</span>
                            </div>
                          </>
                        ) : notif.displayDesc1 ? (
                          <div className="flex items-start">
                            <span className="text-slate-500 mr-2 mt-0.5">•</span>
                            <span>{notif.displayDesc1}</span>
                          </div>
                        ) : notif.displayDesc2 ? (
                          <div className="flex items-start">
                            <span className="text-slate-500 mr-2 mt-0.5">•</span>
                            <span>{notif.displayDesc2}</span>
                          </div>
                        ) : (
                          <div className="text-slate-500 italic">No description provided</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetailsDrawer;
