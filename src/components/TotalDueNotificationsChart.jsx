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
    <div className=" bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[16px] shadow-sm overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Total Due Notifications
          </h3>
        </div>
      </div>
      <div className="w-full">
        <div className="w-full h-[320px]">
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
                <linearGradient id="miAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="meAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="fsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="mcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
              <YAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0' }} />
              <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Area
                type="monotone"
                dataKey="MR"
                name="MR"
                stroke="#f59e0b"
                fill="url(#mrAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="MS"
                name="MS"
                stroke="#2563eb"
                fill="url(#msAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="MI"
                name="MI"
                stroke="#10b981"
                fill="url(#miAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="ME"
                name="ME"
                stroke="#ef4444"
                fill="url(#meAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="FS"
                name="FS"
                stroke="#8b5cf6"
                fill="url(#fsAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="MC"
                name="MC"
                stroke="#ec4899"
                fill="url(#mcAreaGrad)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TotalDueNotificationsChart);
