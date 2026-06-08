import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const TotalDueNotificationsChart = ({ data }) => {
  return (
    <div className="mt-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[16px] shadow-sm overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Total Due Notifications
          </h3>
          <p className="text-sm text-slate-500">
            MR vs MS notification comparison by unit (Area Chart)
          </p>
        </div>
      </div>
      <div className="w-full">
        <div className="w-full h-[320px] sm:h-[470px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <defs>
                <linearGradient id="msAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
              <YAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0' }} />
              <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="MS" name="MS (Static)" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#msAreaGrad)" />
              <Area type="monotone" dataKey="MR" name="MR (Rotary)" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#mrAreaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TotalDueNotificationsChart);
