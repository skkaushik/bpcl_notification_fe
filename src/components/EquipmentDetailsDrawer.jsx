
const EquipmentDetailsDrawer = ({
  selectedEquipment,
  setSelectedEquipment
}) => {
  return (
    <div
      className={`bg-white border-[#E5E7EB] shadow-lg overflow-hidden flex flex-col xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:shrink-0 transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        selectedEquipment
          ? 'flex-[0_0_360px] translate-x-0 opacity-100 border rounded-[24px]'
          : 'flex-[0_0_0px] translate-x-full opacity-0 border-0 rounded-none'
      }`}
    >
      <div className="w-[360px] h-full flex flex-col">
        <div className="flex-shrink-0 p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Equipment Details</h2>
            <p className="text-indigo-600 font-semibold text-sm mt-1">ID: {selectedEquipment?.displayEquipId}</p>
          </div>
          <button onClick={() => setSelectedEquipment(null)} className="rounded-full bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-wider">Notification History</h3>
            {selectedEquipment?.notifications?.map((notif, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-0.5">Notification ID</p>
                    <p className="text-sm font-bold text-slate-900">{notif.displayId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 mb-0.5">Date</p>
                    <p className="text-sm font-bold text-slate-900">{notif.displayDate}</p>
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
                      {notif.displayUnitType}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetailsDrawer;
