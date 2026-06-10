import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
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

const COLORS = [
  '#7dd3fc', // sky 300
  '#6ee7b7', // emerald 300
  '#fcd34d', // amber 300
  '#fca5a5', // red 300
  '#c4b5fd', // violet 300
  '#f9a8d4', // pink 300
  '#fdba74', // orange 300
  '#93c5fd', // blue 300
  '#a7f3d0', // emerald 200
];

const CustomizedContent = (props) => {
  const { x, y, width, height, index, name, value } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: '#ffffff',
          strokeWidth: 2,
          strokeOpacity: 1,
          transition: 'all 0.3s ease',
        }}
        className="hover:opacity-80 cursor-pointer"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 8}
        textAnchor="middle"
        fill="#000000"
        fontSize={width > 40 ? 15 : 11}
        fontWeight="bold"
        dominantBaseline="central"
      >
        {name}
      </text>
      {value > 0 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="#000000"
          fontSize={width > 40 ? 13 : 10}
          fontWeight="bold"
          dominantBaseline="central"
        >
          {value}
        </text>
      )}
    </g>
  );
};

const NotificationTypeBarChart = ({ data = [] }) => {

  const chartData = useMemo(() => {
    return buildChartData(data);
  }, [data]);

  return (
    <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[16px] shadow-sm overflow-hidden">

      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Number of Notifications vs Notification Type
          </h3>
        </div>
      </div>

      <div className="w-full">
        <div className="h-[250px] sm:h-[300px]">
          {chartData.filter(d => d.value > 0).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={chartData.filter(d => d.value > 0)}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#fff"
                content={<CustomizedContent />}
              >
                <Tooltip
                  formatter={(value) => [value, 'Notifications']}
                  itemStyle={{ color: '#000000' }}
                />
              </Treemap>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(NotificationTypeBarChart);