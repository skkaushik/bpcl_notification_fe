export const normalizeKey = (key = "") => String(key).replace(/\s+/g, "").toLowerCase();

export const findKey = (row = {}, targets = []) => {
  const keyMap = Object.keys(row).reduce((map, key) => {
    map[normalizeKey(key)] = key;
    return map;
  }, {});
  for (const t of targets) {
    const found = keyMap[normalizeKey(t)];
    if (found) return found;
  }
  return undefined;
};

export const formatExcelDate = (val) => {

  if (!val) return 'N/A';
  let d;
  if (val instanceof Date) {
    d = val;
  } else if (typeof val === 'number') {
    d = new Date((val - 25569) * 86400 * 1000);
  } else {
    d = new Date(String(val).trim());
  }
  if (isNaN(d)) return String(val);

  return d.toLocaleDateString('en-GB').replace(/\//g, '-');
};

export const calculateKpiStats = (data = []) => {
   const DEPARTMENTS = ["MR", "MS", "MI", "ME", "FS", "MC"];
  const sample = data[0] || {};

  const unitKey = findKey(sample, [
    'Main WorkCtr',
    'MainWorkCtr',
    'Unit',
  ]);
  const total = data.filter((row) => {
  const rawUnit = String(row[unitKey] ?? '')
    .trim()
    .toUpperCase();

  return DEPARTMENTS.some(prefix =>
    rawUnit.startsWith(prefix)
  );
}).length;
  const defaults = {
    totalNotifications: '0',
    notif15Days: '0',
    m2Pending: '0',
    m1Pending: '0',
    overdue: '0',
    impactedUnits: '0',
  };
  if (total === 0) return defaults;
  
  const typeKey = findKey(sample, [
    'Type',
    'Notification Type',
    'Notif Type',
    'NotificationType',
    'Notifictn type',
  ]);
  const notifDateKey = findKey(sample, [
    'Notif.date',
    'Notification Date',
    'Date',
  ]);

  const requiredEndKey = findKey(sample, [
    'Required End',
    'RequiredEnd',
  ]);

  const today = new Date();

  const diffDays = (dateValue) => {
    if (!dateValue) return 0;
    let d;
    if (dateValue instanceof Date) {
      d = dateValue;
    } else if (typeof dateValue === 'number') {
      d = new Date((dateValue - 25569) * 86400 * 1000);
    } else {
      d = new Date(String(dateValue).trim());
    }
    if (isNaN(d)) return 0;
    return Math.floor((today - d) / (1000 * 60 * 60 * 24));
  };

  const notif15Days = data.filter((row) => {
  const rawUnit = String(row[unitKey] ?? '')
    .trim()
    .toUpperCase();

  if (
    !DEPARTMENTS.some(prefix =>
      rawUnit.startsWith(prefix)
    )
  ) {
    return false;
  }

  return diffDays(row[notifDateKey]) > 15;
}).length;

  const m2Pending = data.filter((row) => {
    const type = String(row[typeKey] ?? '').trim().toUpperCase();
    const rawUnit = String(row[unitKey] ?? '').trim().toUpperCase();
    const isValidDept =
     DEPARTMENTS.some(prefix =>
    rawUnit.startsWith(prefix)
  );
    const isM2 = type === 'M2';
    const olderThan7 = diffDays(row[notifDateKey]) > 7;
    return (
  isValidDept &&
  isM2 &&
  olderThan7
);
  }).length;

  const m1Pending = data.filter((row) => {
    const type = String(row[typeKey] ?? '').trim().toUpperCase();
    const rawUnit = String(row[unitKey] ?? '').trim().toUpperCase();
    const isValidDept =
  DEPARTMENTS.some(prefix =>
    rawUnit.startsWith(prefix)
  );
    const isM1 = type === 'M1';
    const olderThan25 = diffDays(row[notifDateKey]) > 25;
    return (
  isValidDept &&
  isM1 &&
  olderThan25
);
  }).length;

  const overdue = data.filter((row) => {
    const value = row[requiredEndKey];
    if (value === '' || value === null || value === undefined) {
      return false;
    }
    let requiredDate;
    if (value instanceof Date) {
      requiredDate = value;
    } else if (typeof value === 'number') {
      requiredDate = new Date((value - 25569) * 86400 * 1000);
    } else {
      requiredDate = new Date(String(value).trim());
    }
    if (isNaN(requiredDate)) {
      return false;
    }
    return requiredDate < today;
  }).length;

  const unitSet = new Set();
  data.forEach((row) => {
    const rawUnit = String(row[unitKey] ?? '').trim().toUpperCase();
    if (!rawUnit) return;
   if (
 !DEPARTMENTS.some(prefix =>
    rawUnit.startsWith(prefix)
 )
) {
 return;
}
    let cleanedUnit = rawUnit.substring(2).trim();
    if (!cleanedUnit) return;
    unitSet.add(cleanedUnit);
  });

  const impactedUnits = unitSet.size;

  return {
    totalNotifications: String(total),
    notif15Days: String(notif15Days),
    m2Pending: String(m2Pending),
    m1Pending: String(m1Pending),
    overdue: String(overdue),
    impactedUnits: String(impactedUnits),
  };
};

export const buildDueChartData = (data = []) => {
  const groupedData = {};

  data.forEach((row) => {
    const rawWorkCtr = String(row['Main WorkCtr'] ?? '').trim().toUpperCase();
    if (!rawWorkCtr) return;
    if (!rawWorkCtr.startsWith('MR') && !rawWorkCtr.startsWith('MS')) {
      return;
    }

    const prefix = rawWorkCtr.substring(0, 2);
    const unit = rawWorkCtr.substring(2);
    if (!unit) return;

    if (!groupedData[unit]) {
      groupedData[unit] = {
        unit,
        MR: 0,
        MS: 0,
      };
    }
    groupedData[unit][prefix] += 1;
  });

  return Object.values(groupedData);
};
