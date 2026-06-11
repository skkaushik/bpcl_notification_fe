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

const UnitWiseBarChart = ({
  title,
  selectedDepartments = [],
  data = []
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const typeKey = findKey(data[0], ['notificationtype', 'type']);
    const unitKey = findKey(data[0], ['mainworkctr', 'unit']);
    const notifKey = findKey(data[0], ['notification', 'notificationno', 'notifictn'], ['type']);

    if (!typeKey || !unitKey || !notifKey) return [];

    const grouped = {};

    data.forEach((row) => {
      const rawUnitStr = String(row[unitKey] ?? '')
        .trim()
        .toUpperCase();

      const deptPrefix = rawUnitStr.substring(0, 2);

      const isAllowed =
        selectedDepartments.length === 0 ||
        selectedDepartments.includes(deptPrefix);

      if (!isAllowed) return;

      const unitName = rawUnitStr.substring(2);

      const rawType = String(row[typeKey] ?? '')
        .trim()
        .toUpperCase();

      const typeName = rawType.replace(/\s+/g, '');

      const notifId = String(row[notifKey] ?? '').trim();

      if (unitName && typeName && notifId) {
        if (!grouped[unitName]) grouped[unitName] = {};

        if (!grouped[unitName][typeName]) {
          grouped[unitName][typeName] = new Set();
        }

        grouped[unitName][typeName].add(notifId);
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
  }, [data, selectedDepartments]);
  const chartWidth = useMemo(() => {
    return Math.max(chartData.length * 55, 1400);
  }, [chartData]);

  const CustomTick = (props) => {
    const { x, y, payload } = props;
    const [, type] = payload.value.split('-');

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={15} dy={0} textAnchor="middle" fill="#64748B" fontSize={11} fontWeight="bold">
          {type}
        </text>
      </g>
    );
  };

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

  const CustomUnitTick = (props) => {
    const { x, y, payload, index, width, visibleTicksCount } = props;
    const unit = payload.value;
    const isCenter = centerTickIndices.has(index);

    const nextItem = chartData[index + 1];
    const showSeparator = nextItem && nextItem.unit !== unit;

    let groupLength = 0;
    for (let i = index; i >= 0 && chartData[i]?.unit === unit; i--) groupLength++;
    for (let i = index + 1; i < chartData.length && chartData[i]?.unit === unit; i++) groupLength++;

    // Calculate the distance between ticks exactly
    // In Recharts, the actual drawing width of the axis might be width, or we can approximate it.
    // If width or visibleTicksCount is missing, provide a fallback.
    const axisWidth = width || 600;
    const ticksCount = visibleTicksCount || chartData.length || 1;
    const tickSpacing = axisWidth / ticksCount;

    return (
      <g transform={`translate(${x},${y})`}>
        {isCenter && (
          <text x={groupLength % 2 === 0 ? tickSpacing / 2 : 0} y={15} dy={0} textAnchor="middle" fill="#1e293b" fontSize={12} fontWeight="bold">
            {unit}
          </text>
        )}
        {showSeparator && (
          <line x1={tickSpacing / 2} y1="-25" x2={tickSpacing / 2} y2="25" stroke="#cbd5e1" strokeWidth="2" />
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[16px] shadow-sm flex flex-col">
      <div className="mb-3 flex items-center justify-between shrink-0">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      {chartData.length === 0 ? (
        <div className="flex flex-1 min-h-[250px] items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          No data available
        </div>
      ) : (
        <div className="w-full flex-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#003865]/40 hover:scrollbar-thumb-[#003865]/70 scrollbar-track-transparent">
          <div
            className="h-[320px] min-h-[320px]"
            style={{
              minWidth: `${Math.max(chartData.length * 45, 1000)}px`,
              width: "100%",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: -5, bottom: 5 }}
              >

                <defs>
                  <linearGradient
                    id="notificationBarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#003865" />
                    <stop offset="100%" stopColor="#4866c9" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={<CustomTick />}
                  interval={0}
                  height={25}
                />
                <XAxis
                  xAxisId={1}
                  dataKey="unit"
                  axisLine={false}
                  tickLine={false}
                  tick={<CustomUnitTick />}
                  interval={0}
                  height={30}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={40} />
                <Tooltip
                  cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                  formatter={(value, name, props) => [value, `Notifications (${props.payload.type})`]}
                  labelFormatter={(label) => label.split('-')[0]}
                />
                <Bar dataKey="count" fill="url(#notificationBarGradient)" radius={[4, 4, 0, 0]} maxBarSize={30}>
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