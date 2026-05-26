import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
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

const UnitWiseBarChart = ({ title, prefix, data = [] }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const typeKey = findKey(data[0], ['notificationtype', 'type']);
    const unitKey = findKey(data[0], ['mainworkctr', 'unit']);
    const notifKey = findKey(data[0], ['notification', 'notificationno', 'notifictn'], ['type']);

    if (!typeKey || !unitKey || !notifKey) return [];

    // Grouping structure: { "CDU": { "M2": Set(), "M4": Set() } }
    const grouped = {};

    data.forEach((row) => {
      const rawUnitStr = String(row[unitKey] ?? '').trim().toUpperCase();
      
      // Check if it matches our desired prefix (MS or MR)
      if (rawUnitStr.startsWith(prefix)) {
        const unitName = rawUnitStr.substring(2); // Extract unit without prefix
        const rawType = String(row[typeKey] ?? '').trim().toUpperCase();
        const typeName = rawType.replace(/\s+/g, '');
        const notifId = String(row[notifKey] ?? '').trim();

        if (unitName && typeName && notifId) {
          if (!grouped[unitName]) grouped[unitName] = {};
          if (!grouped[unitName][typeName]) grouped[unitName][typeName] = new Set();
          
          grouped[unitName][typeName].add(notifId);
        }
      }
    });

    // Flatten it into an array
    const result = [];
    Object.keys(grouped).sort().forEach((unit) => {
      Object.keys(grouped[unit]).sort().forEach((type) => {
        result.push({
          label: `${unit}-${type}`, // unique key
          unit: unit,
          type: type,
          count: grouped[unit][type].size
        });
      });
    });

    return result;
  }, [data, prefix]);

  // Custom XAxis tick to show Type on top and Unit below
  const CustomTick = (props) => {
    const { x, y, payload } = props;
    const [unit, type] = payload.value.split('-');
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={15} dy={0} textAnchor="middle" fill="#64748B" fontSize={11} fontWeight="bold">
          {type}
        </text>
        <text x={0} y={30} dy={0} textAnchor="middle" fill="#94A3B8" fontSize={10}>
          {unit}
        </text>
      </g>
    );
  };

  return (
    <div className="mb-8">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      {chartData.length === 0 ? (
        <div className="flex h-[250px] items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          No {prefix} data available
        </div>
      ) : (
        <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[600px] h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={<CustomTick />} 
                  interval={0} // Show all ticks
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={40} />
                <Tooltip 
                  cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                  formatter={(value, name, props) => [value, `Notifications (${props.payload.type})`]}
                  labelFormatter={(label) => label.split('-')[0]}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  <LabelList dataKey="count" position="top" fill="#0f172a" fontSize={11} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitWiseBarChart;
