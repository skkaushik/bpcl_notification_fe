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

    const grouped = {};

    data.forEach((row) => {
      const rawUnitStr = String(row[unitKey] ?? '').trim().toUpperCase();
      

      if (rawUnitStr.startsWith(prefix)) {
        const unitName = rawUnitStr.substring(2);
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

    const result = [];
    Object.keys(grouped).sort().forEach((unit) => {
      Object.keys(grouped[unit]).sort().forEach((type) => {
        result.push({
          label: `${unit}-${type}`,
          unit: unit,
          type: type,
          count: grouped[unit][type].size
        });
      });
    });

    return result;
  }, [data, prefix]);

  const centerTickIndices = useMemo(() => {
    const indices = new Set();
    let start = 0;

    while (start < chartData.length) {
      const unit = chartData[start]?.unit;
      let end = start;
      while (end + 1 < chartData.length && chartData[end + 1].unit === unit) {
        end += 1;
      }
      const center = Math.floor((start + end) / 2);
      indices.add(center);
      start = end + 1;
    }

    return indices;
  }, [chartData]);

  const CustomTick = ({ x, y, payload, index }) => {
    const [unit, type] = payload.value.split('-');
    const showUnit = centerTickIndices.has(index);
    
    const nextItem = chartData[index + 1];
    const showSeparator = nextItem && nextItem.unit !== unit;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={15} dy={0} textAnchor="middle" fill="#64748B" fontSize={11} fontWeight="bold">
          {type}
        </text>
        <text x={0} y={30} dy={0} textAnchor="middle" fill="#94A3B8" fontSize={10}>
          {showUnit ? unit : ''}
        </text>
        {showSeparator && (
          <line x1="14" y1="-10" x2="14" y2="35" stroke="#d1d5db" strokeWidth="1" />
        )}
      </g>
    );
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-[24px] shadow-sm overflow-hidden">
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
                margin={{ top: 20, right: 20, left: -20, bottom: 50 }}
              >

              <defs>
                <linearGradient
                  id="notificationBarGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={CustomTick} 
                  interval={0}
                  height={65}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={40} />
                <Tooltip 
                  cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                  formatter={(value, name, props) => [value, `Notifications (${props.payload.type})`]}
                  labelFormatter={(label) => label.split('-')[0]}
                />
                <Bar dataKey="count"  fill="url(#notificationBarGradient)" radius={[4, 4, 0, 0]} maxBarSize={30}>
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

export default React.memo(UnitWiseBarChart);