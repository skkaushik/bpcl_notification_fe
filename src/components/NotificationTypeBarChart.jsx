import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';

const normalizeKey = (key = '') =>
  String(key).replace(/\s+/g, '').toLowerCase();

const findKey = (row = {}, targets = []) => {
  const keyMap = Object.keys(row).reduce(
    (map, key) => {
      map[normalizeKey(key)] = key;
      return map;
    },
    {}
  );
  for (const t of targets) {
    const found =
      keyMap[normalizeKey(t)];
    if (found) return found;
  }
  return undefined;
};

const findNotificationTypeKey = (row = {}) => {
  const keys = Object.keys(row);

  const targets = [
    'notificationtype',
    'notificationtype',
    'notification type',
    'notification_type',
    'type',
  ];

  const match = keys.find((key) => {
    const normalized = normalizeKey(key);

    return targets.some(
      (target) =>
        normalized === normalizeKey(target) ||
        normalized.includes(normalizeKey(target))
    );
  });

  return match;
};

const defaultTypes = [
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'M7',
  'M8',
  'M9',
];

const buildChartData = (data) => {
  const DEPARTMENTS = [
    "MR",
    "MS",
    "MI",
    "ME",
    "FS",
    "MC",
  ];
  console.log('Chart Excel Data:', data);

  const notificationSets = defaultTypes.reduce((acc, type) => {
    acc[type] = new Set();
    return acc;
  }, {});

  if (!Array.isArray(data) || data.length === 0) {
    return defaultTypes.map((name) => ({
      name,
      value: 0,
    }));
  }

  const typeKey = findNotificationTypeKey(data[0]);

  const keys = Object.keys(data[0]);
  const notifTargets = ['notification', 'notificationno', 'notificationnumber', 'notifictn'];
  const notifKey = keys.find((key) => {
    const normalized = normalizeKey(key);
    return notifTargets.some((target) => normalized.includes(target)) && !normalized.includes('type');
  });

  console.log('Detected Notification Type Key:', typeKey);
  console.log('Detected Notification Key:', notifKey);

  if (!typeKey || !notifKey) {
    return defaultTypes.map((name) => ({
      name,
      value: 0,
    }));
  }
  const unitKey = findKey(data[0], [
    'Main WorkCtr',
    'MainWorkCtr',
    'Unit',
  ]);

  data.forEach((row) => {
    const rawType = String(row[typeKey] ?? '').trim().toUpperCase();
    const normalizedType = rawType.replace(/\s+/g, '');
    const notifId = String(row[notifKey] ?? '').trim();
    const rawUnit = String(
      row[unitKey] ?? ''
    )
      .trim()
      .toUpperCase();

    if (
      !DEPARTMENTS.some(prefix =>
        rawUnit.startsWith(prefix)
      )
    ) {
      return;
    }

    if (defaultTypes.includes(normalizedType) && notifId) {
      notificationSets[normalizedType].add(notifId);
    }
  });

  return defaultTypes.map((name) => ({
    name,
    value: notificationSets[name].size,
  }));
};

const NotificationTypeBarChart = ({ data = [] }) => {

  const chartData = useMemo(() => {
    return buildChartData(data);
  }, [data]);

  return (
    <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[16px] shadow-sm ">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">
          Notifications vs Notification Type
        </h3>
      </div>

      {chartData.filter(d => d.value > 0).length === 0 ? (
        <div className="flex h-[250px] items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          No data available
        </div>
      ) : (
        <div className="w-full">
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.filter(d => d.value > 0)}
                margin={{ top: 20, right: 20, left: -5, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="notificationTypeBarGradient"
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
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: "bold" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                  formatter={(value) => [value, 'Notifications']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" fill="url(#notificationTypeBarGradient)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  <LabelList dataKey="value" position="top" fill="#0f172a" fontSize={11} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(NotificationTypeBarChart);