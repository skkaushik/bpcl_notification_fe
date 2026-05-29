import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Label,
} from 'recharts';

const normalizeKey = (key = '') => String(key).replace(/\s+/g, '').toLowerCase();

const findKey = (row = {}, targets = [], exclude = []) => {
  const keys = Object.keys(row);
  return keys.find((key) => {
    const normalized = normalizeKey(key);
    const matchesTarget = targets.some((target) => normalized.includes(target) || normalized === target);
    const hasExclude = exclude.some((ex) => normalized.includes(ex));
    return matchesTarget && !hasExclude;
  });
};

const COLORS = ['#f59e0b', '#3b82f6'];

const MrMsPieChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const unitKey = findKey(data[0], ['mainworkctr', 'unit']);
    const notifKey = findKey(data[0], ['notification', 'notificationno', 'notifictn'], ['type']);

    if (!unitKey || !notifKey) return [];

    const uniqueNotifs = new Set();
    let mrCount = 0;
    let msCount = 0;

    data.forEach((row) => {
      const notifId = String(row[notifKey] ?? '').trim();
      if (!notifId || uniqueNotifs.has(notifId)) return;
      
      uniqueNotifs.add(notifId);
      
      const rawUnitStr = String(row[unitKey] ?? '').trim().toUpperCase();
      if (rawUnitStr.startsWith('MR')) {
        mrCount++;
      } else if (rawUnitStr.startsWith('MS')) {
        msCount++;
      }
    });

    return [
      { name: `MR (Rotary): ${mrCount}`, value: mrCount },
      { name: `MS (Static): ${msCount}`, value: msCount }
    ];
  }, [data]);

  const totalNotifs = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="mb-5 flex w-full items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">MR vs MS Overview</h3>
      </div>
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              className="outline-none focus:outline-none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none focus:outline-none" />
              ))}
              <Label
                value={totalNotifs}
                position="center"
                className="text-3xl font-bold fill-slate-800"
              />
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} Notifications`, undefined]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: '500', color: '#475569' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MrMsPieChart;
