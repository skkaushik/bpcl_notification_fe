import React from 'react';
import { KPI_CARDS_CONFIG } from '../utils/constants';

const KpiSection = ({ stats }) => {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-4">
      {KPI_CARDS_CONFIG.map((config) => (
        <div key={config.label} className={`group flex flex-col justify-between ${config.bgColor} rounded-[16px] p-[16px] shadow-sm border border-slate-100/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{config.label}</p>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.iconBg} ${config.textColor} text-base`}>
              {config.icon}
            </div>
          </div>
          <div className="flex items-baseline mt-2">
            <h3 className={`text-4xl font-black tracking-tight ${config.textColor}`}>{stats[config.key]}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiSection;
