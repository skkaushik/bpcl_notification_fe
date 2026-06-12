import React, { useMemo } from 'react';

const TopEquipmentList = ({ data = [], onEquipmentClick, onViewAllClick }) => {
  const listData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    // Sort by notification count descending
    const sorted = [...data].sort((a, b) => b.notificationCount - a.notificationCount);

    // Take top 10
    return sorted.slice(0, 10);
  }, [data]);

  return (
    <div className="w-full h-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[16px] shadow-sm flex flex-col">
      <div className="mb-3 flex items-center justify-between shrink-0">
        <h3 className="text-lg font-bold text-slate-900">
          Top 10 Crtical Equipments
        </h3>
        <button 
          onClick={onViewAllClick}
          className="text-[13px] font-bold text-[#ffc000] hover:text-[#003865] flex items-center gap-1 transition-colors cursor-pointer"
        >
          More
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
        {listData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            No data available
          </div>
        ) : (
          listData.map((item) => {
            let bgClass = "bg-rose-50";
            let textClass = "text-rose-700";
            let badgeBgClass = "bg-rose-100/80";

            if (item.notificationCount <= 2) {
              bgClass = "bg-[#eefcf4]"; // Light emerald to match the "In Office" green
              textClass = "text-emerald-700";
              badgeBgClass = "bg-emerald-100/80";
            } else if (item.notificationCount <= 5) {
              bgClass = "bg-[#fff8f1]"; // Light amber
              textClass = "text-amber-700";
              badgeBgClass = "bg-amber-100/80";
            } else {
              bgClass = "bg-[#fff5f5]"; // Light rose to match the "Out of Office" red
            }

            return (
              <div
                key={item.displayEquipId}
                onClick={() => onEquipmentClick?.(item)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-[8px] transition-colors cursor-pointer hover:opacity-80 ${bgClass}`}
              >
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1 rounded-full shadow-sm flex items-center justify-center">
                    <svg className={`w-3 h-3 ${textClass}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold text-slate-800 leading-none">{item.displayEquipId}</span>
                </div>
                <div>
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${badgeBgClass} ${textClass}`}>
                    {item.notificationCount} {item.notificationCount === 1 ? 'Notif' : 'Notifs'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(TopEquipmentList);
