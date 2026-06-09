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
    <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[16px] shadow-sm overflow-hidden">

      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Number of Notifications vs Notification Type
          </h3>

          <p className="text-sm text-slate-500">
            Counts are calculated from uploaded Excel data.
          </p>
        </div>
      </div>

      <div className="w-full">
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 20,
                bottom: 0,
              }}
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

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#64748B',
                  fontSize: 12,
                  fontWeight: 700,
                }}
                tickMargin={12}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#64748B',
                  fontSize: 12,
                }}
                width={40}
              />

              <Tooltip
                cursor={{
                  fill: 'rgba(15, 23, 42, 0.04)',
                }}
                formatter={(value) => [
                  value,
                  'Notifications',
                ]}
              />

              <Bar
                dataKey="value"
                fill="url(#notificationBarGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                animationDuration={800}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  fill="#0f172a"
                  fontSize={12}
                  fontWeight={700}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default React.memo(NotificationTypeBarChart);