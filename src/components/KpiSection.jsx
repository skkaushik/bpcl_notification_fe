import React from 'react';
import { KPI_CARDS_CONFIG } from '../utils/constants';

const KpiSection = ({ stats }) => {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-4">
      {KPI_CARDS_CONFIG.map((config) => {
        return (
          <div 
            key={config.label} 
            className={`bg-white rounded-[16px] p-5 shadow-sm border border-slate-200 border-l-[8px] ${config.leftBorderColor} flex flex-col justify-between min-h-[120px] transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
          >
            <p className="text-[16px] font-black capitalize tracking-wider text-slate-700 truncate" title={config.label}>
              {config.label}
            </p>
            <h3 className={`text-3xl font-black tracking-tight mt-2 ${config.textColor}`}>
              {stats[config.key]}
            </h3>
          </div>
        );
      })}
    </div>
  );
};

export default KpiSection;
