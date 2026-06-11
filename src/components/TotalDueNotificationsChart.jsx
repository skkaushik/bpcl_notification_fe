import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,

} from 'recharts';

const TotalDueNotificationsChart = ({ data }) => {
  return (
    <div className=" bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[16px] shadow-sm overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
  <h3 className="text-lg font-bold text-slate-900">
    Total Due Notifications
  </h3>

  <div className="flex items-center gap-3 text-xs font-semibold">
    
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#154c7a]"  />
      <span className="text-[#154c7a]">FS</span>
    </div>

    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#f73495]" />
      <span className="text-[#f73495]">MC</span>
    </div>

    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#b80b0b]" />
      <span className="text-[#b80b0b]">ME</span>
    </div>

    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#00885b]" />
      <span className="text-[#00885b]">MI</span>
    </div>

    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#ca8714]" />
      <span className="text-[#ca8714]">MR</span>
    </div>

    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-[#103d9e]" />
      <span className="text-[#103d9e]">MS</span>
    </div>

  </div>
</div>
      <div className="w-full">
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -8, bottom: 10 }}>
              <defs>
                <linearGradient id="msAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#103d9e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#103d9e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ca8714" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ca8714" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="miAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00885b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00885b" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="meAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b80b0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#b80b0b" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="fsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#154c7a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#154c7a" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="mcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f73495" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f73495" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
              <YAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0' }} />
              <Area
                type="monotone"
                dataKey="MR"
                name="MR"
                stroke="#ca8714"
                fill="url(#mrAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="MS"
                name="MS"
                stroke="#103d9e"
                fill="url(#msAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="MI"
                name="MI"
                stroke="#00885b"
                fill="url(#miAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="ME"
                name="ME"
                stroke="#b80b0b"
                fill="url(#meAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="FS"
                name="FS"
                stroke="#154c7a"
                fill="url(#fsAreaGrad)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="MC"
                name="MC"
                stroke="#f73495"
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
