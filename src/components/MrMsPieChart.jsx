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

const COLORS = [
  '#ca8714', // MR
  '#367cec', // MS
  '#00885b', // MI
  '#b80b0b', // ME
  '#154c7a', // FS
  '#0a869c', // MC
];
const MrMsPieChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const unitKey = findKey(data[0], ['mainworkctr', 'unit']);
    const notifKey = findKey(data[0], ['notification', 'notificationno', 'notifictn'], ['type']);

    if (!unitKey || !notifKey) return [];

    const uniqueNotifs = new Set();
   const deptCounts = {
  MR: 0,
  MS: 0,
  MI: 0,
  ME: 0,
  FS: 0,
  MC: 0,
};

    data.forEach((row) => {
      const notifId = String(row[notifKey] ?? '').trim();
      if (!notifId || uniqueNotifs.has(notifId)) return;
      
      uniqueNotifs.add(notifId);
      
      const rawUnitStr = String(row[unitKey] ?? '').trim().toUpperCase();
      const deptPrefix = rawUnitStr.substring(0, 2);
     if (deptCounts[deptPrefix] !== undefined) {
       deptCounts[deptPrefix]++;
}
    });

    return [
  { name: `MR: ${deptCounts.MR}`, value: deptCounts.MR },
  { name: `MS: ${deptCounts.MS}`, value: deptCounts.MS },
  { name: `MI: ${deptCounts.MI}`, value: deptCounts.MI },
  { name: `ME: ${deptCounts.ME}`, value: deptCounts.ME },
  { name: `FS: ${deptCounts.FS}`, value: deptCounts.FS },
  { name: `MC: ${deptCounts.MC}`, value: deptCounts.MC },
].filter(item => item.value > 0);
  }, [data]);

  const totalNotifs = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[16px] shadow-sm overflow-hidden flex flex-col items-center justify-center w-full h-full">
      <div className="mb-2 flex w-full items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Notifications Overview</h3>
      </div>
      <div className="flex-1 w-full min-h-[250px]">
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
              formatter={(value, name) => [`${value} Notifications`, name.split(':')[0]]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="square" wrapperStyle={{ fontSize: '14px', fontWeight: '500', color: '#475569', paddingTop: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(MrMsPieChart);
