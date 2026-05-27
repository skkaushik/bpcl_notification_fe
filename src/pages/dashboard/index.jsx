import Layout from "../../components/Layout";
import NotificationTypeBarChart from "../../components/NotificationTypeBarChart";
import UnitWiseBarChart from "../../components/UnitWiseBarChart";
import SendEmailModal from "../../components/SendEmailModal";
import MrMsPieChart from "../../components/MrMsPieChart";
import { useState, useRef, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import Select, { components } from "react-select";
import { emailConfig } from "../../data/emailConfig";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';


const normalizeKey = (key = "") => String(key).replace(/\s+/g, "").toLowerCase();
const findKey = (row = {}, targets = []) => {
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
const calculateKpiStats = (data = []) => {
  const sample = data[0] || {};

  const unitKey = findKey(sample, [
    'Main WorkCtr',
    'MainWorkCtr',
    'Unit',
  ]);
  const total = data.filter((row) => {

    const rawUnit = String(
      row[unitKey] ?? ''
    )
      .trim()
      .toUpperCase();

    return (
      rawUnit.startsWith('MR') ||
      rawUnit.startsWith('MS')
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

  const statusKey = findKey(sample, [
    'Status',
    'User status',
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

    return Math.floor(
      (today - d) / (1000 * 60 * 60 * 24)
    );
  };

  const notif15Days = data.filter((row) => {

    const rawUnit = String(
      row[unitKey] ?? ''
    )
      .trim()
      .toUpperCase();

    // ONLY MR and MS
    if (
      !rawUnit.startsWith('MR') &&
      !rawUnit.startsWith('MS')
    ) {
      return false;
    }

    // Notification older than 15 days
    return diffDays(
      row[notifDateKey]
    ) > 15;

  }).length;

  const m2Pending = data.filter((row) => {

    const type = String(
      row[typeKey] ?? ''
    )
      .trim()
      .toUpperCase();

    const rawUnit = String(
      row[unitKey] ?? ''
    )
      .trim()
      .toUpperCase();

    const isMRorMS =
      rawUnit.startsWith('MR') ||
      rawUnit.startsWith('MS');

    const isM2 =
      type === 'M2';

    const olderThan7 =
      diffDays(
        row[notifDateKey]
      ) > 7;

    return (
      isMRorMS &&
      isM2 &&
      olderThan7
    );

  }).length;

  const m1Pending = data.filter((row) => {

    const type = String(
      row[typeKey] ?? ''
    )
      .trim()
      .toUpperCase();

    const rawUnit = String(
      row[unitKey] ?? ''
    )
      .trim()
      .toUpperCase();

    const isMRorMS =
      rawUnit.startsWith('MR') ||
      rawUnit.startsWith('MS');

    const isM1 =
      type === 'M1';

    const olderThan25 =
      diffDays(
        row[notifDateKey]
      ) > 25;

    return (
      isMRorMS &&
      isM1 &&
      olderThan25
    );

  }).length;
  const overdue = data.filter((row) => {

    const value = row[requiredEndKey];

    // Ignore only visible blank cells
    if (
      value === '' ||
      value === null ||
      value === undefined
    ) {
      return false;
    }
    let requiredDate;
    // If already Date object
    if (value instanceof Date) {
      requiredDate = value;
    }
    // If Excel serial number
    else if (typeof value === 'number') {

      requiredDate = new Date(
        (value - 25569) * 86400 * 1000
      );
    }
    // If string date
    else {
      requiredDate = new Date(
        String(value).trim()
      );
    }
    // Ignore invalid dates
    if (isNaN(requiredDate)) {
      return false;
    }
    return requiredDate < today;
  }).length;
  const unitSet = new Set();

  data.forEach((row) => {

    // Take only Main WorkCtr column
    const rawUnit = String(
      row[unitKey] ?? ''
    )
      .trim()
      .toUpperCase();

    // Ignore blank values
    if (!rawUnit) return;

    // ONLY allow MR and MS
    if (
      !rawUnit.startsWith('MR') &&
      !rawUnit.startsWith('MS')
    ) {
      return;
    }

    // Remove MR / MS prefix
    let cleanedUnit = rawUnit.substring(2);

    // Final clean value
    cleanedUnit = cleanedUnit.trim();

    // Ignore empty after cleaning
    if (!cleanedUnit) return;

    // Add unique unit only once
    unitSet.add(cleanedUnit);

  });

  // Final unique unit count
  const impactedUnits = unitSet.size;

  console.log(
    "Unique Units:",
    [...unitSet]
  );

  console.log(
    "Total Impacted Units:",
    impactedUnits
  );
  return {
    totalNotifications: String(total),
    notif15Days: String(notif15Days),
    m2Pending: String(m2Pending),
    m1Pending: String(m1Pending),
    overdue: String(overdue),
    impactedUnits: String(impactedUnits),
  };
};
const buildDueChartData = (data = []) => {

  const groupedData = {};

  data.forEach((row) => {

    const rawWorkCtr = String(
      row['Main WorkCtr'] ?? ''
    )
      .trim()
      .toUpperCase();

    // Ignore blank
    if (!rawWorkCtr) return;

    // Only MR and MS
    if (
      !rawWorkCtr.startsWith('MR') &&
      !rawWorkCtr.startsWith('MS')
    ) {
      return;
    }

    // Extract prefix
    const prefix = rawWorkCtr.substring(0, 2);

    // Remove MR / MS
    const unit = rawWorkCtr.substring(2);

    if (!unit) return;

    // Create object
    if (!groupedData[unit]) {

      groupedData[unit] = {
        unit,
        MR: 0,
        MS: 0,
      };

    }

    // Increase count
    groupedData[unit][prefix] += 1;

  });

  return Object.values(groupedData);

};
const InputOption = ({
  getStyles,
  Icon,
  isDisabled,
  isFocused,
  isSelected,
  children,
  innerProps,
  ...rest
}) => {
  const [isActive, setIsActive] = useState(false);
  const onMouseDown = () => setIsActive(true);
  const onMouseUp = () => setIsActive(false);
  const onMouseLeave = () => setIsActive(false);

  // Style the option container
  let bg = "transparent";
  if (isFocused) bg = "#f8fafc";
  if (isActive) bg = "#f1f5f9";

  const style = {
    alignItems: "center",
    backgroundColor: bg,
    color: "inherit",
    display: "flex ",
    padding: "8px 12px",
    cursor: "pointer",
  };

  const props = {
    ...innerProps,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    style,
  };

  return (
    <components.Option
      {...rest}
      isDisabled={isDisabled}
      isFocused={isFocused}
      isSelected={isSelected}
      getStyles={getStyles}
      innerProps={props}
    >
      <input 
        type="checkbox" 
        checked={isSelected} 
        readOnly 
        className="mr-3 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-sm font-medium text-slate-700">{children}</span>
    </components.Option>
  );
};

const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showGlobalEmailModal, setShowGlobalEmailModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [processingPercent, setProcessingPercent] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  // Global filter: 'ALL' or one of M1..M9
  const [activeTypeFilter, setActiveTypeFilter] = useState([]);
  const [emailActiveTypeFilter, setEmailActiveTypeFilter] = useState([]);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [ageDayFilter, setAgeDayFilter] = useState('');
  const ALL_TYPES = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'];

  // Derive the actual type key from rawData once
  const typeKeyInData = useMemo(() => {
    if (!rawData.length) return null;
    const sample = rawData[0];
    const keys = Object.keys(sample);
    return keys.find((k) => {
      const n = k.replace(/\s+/g, '').toLowerCase();
      return n.includes('notificationtype') || n.includes('notifictntype') || n === 'type';
    }) || null;
  }, [rawData]);

  // Filtered rawData based on active type
  const filteredRawData = useMemo(() => {

    if (
      activeTypeFilter.length === 0 ||
      !typeKeyInData
    ) {
      return rawData;
    }

    const selectedValues =
      activeTypeFilter.map((item) => item.value);

    return rawData.filter((row) =>
      selectedValues.includes(
        String(row[typeKeyInData] ?? '')
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '')
      )
    );

  }, [rawData, activeTypeFilter, typeKeyInData]);

  // Filtered notifications (table rows) based on active type
  const filteredNotifications = useMemo(() => {
    let result = notifications.filter(n => {
      const rawUnit = String(n.workCtr ?? '').trim().toUpperCase();
      return rawUnit.startsWith('MR') || rawUnit.startsWith('MS');
    });

    if (activeTypeFilter.length > 0) {
      const selectedValues = activeTypeFilter.map((item) => item.value);
      result = result.filter((n) =>
        selectedValues.includes(
          String(n.type ?? '').trim().toUpperCase().replace(/\s+/g, '')
        )
      );
    }
    return result;
  }, [notifications, activeTypeFilter]);

  // Filtered notifications strictly for the email modal
  const emailFilteredNotifications = useMemo(() => {
    let result = notifications.filter(n => {
      const rawUnit = String(n.workCtr ?? '').trim().toUpperCase();
      return rawUnit.startsWith('MR') || rawUnit.startsWith('MS');
    });

    if (emailActiveTypeFilter.length > 0) {
      const selectedValues = emailActiveTypeFilter.map((item) => item.value);
      result = result.filter((n) =>
        selectedValues.includes(
          String(n.type ?? '').trim().toUpperCase().replace(/\s+/g, '')
        )
      );
    }

    if (startDateFilter || endDateFilter || ageDayFilter) {
      const today = new Date();

      result = result.filter(n => {
        let passDate = true;
        let passAge = true;
        const notifDate = n.notifDate && n.notifDate !== 'N/A' ? new Date(n.notifDate) : null;

        if (notifDate && !isNaN(notifDate)) {
          if (startDateFilter) {
            passDate = passDate && (notifDate >= new Date(startDateFilter));
          }
          if (endDateFilter) {
            passDate = passDate && (notifDate <= new Date(endDateFilter));
          }

          if (ageDayFilter) {
            const ageDays = Math.floor((today - notifDate) / (1000 * 60 * 60 * 24));
            passAge = ageDays >= parseInt(ageDayFilter, 10);
          }
        } else {
          passDate = false;
        }

        return passDate && passAge;
      });
    }

    return result;
  }, [notifications, emailActiveTypeFilter, startDateFilter, endDateFilter, ageDayFilter]);

  const emailGroups = useMemo(() => {
    const groups = {};
    emailFilteredNotifications.forEach(notif => {
      const type = String(notif.type ?? '').trim().toUpperCase();
      const rawUnit = String(notif.workCtr ?? '').trim().toUpperCase();
      const status = String(notif.status ?? '').trim().toUpperCase();
      let prefix = ''; let plantName = rawUnit;
      if (rawUnit.startsWith('MR') || rawUnit.startsWith('MS')) {
        prefix = rawUnit.substring(0, 2);
        plantName = rawUnit.substring(2).trim();
      }
      const plantConfig = emailConfig.find(p => p.plantName.toUpperCase() === plantName);
      if (plantConfig) {
        const isProcessType = ['M1', 'M2', 'M6'].includes(type);
        const isProcessStatus = status === 'PENDING' || status.includes('APRE') || status.includes('JBCO');
        let targetEmail = '';
        if (isProcessType && isProcessStatus) targetEmail = plantConfig.processEmail;
        else if (prefix === 'MR') targetEmail = plantConfig.rotaryMail;
        else if (prefix === 'MS') targetEmail = plantConfig.staticMail;
        else targetEmail = plantConfig.processEmail || plantConfig.rotaryMail || plantConfig.staticMail;

        if (targetEmail) {
          if (!groups[targetEmail]) groups[targetEmail] = [];
          groups[targetEmail].push(notif.id);
        }
      }
    });
    return groups;
  }, [filteredNotifications]);

  const dueChartData = useMemo(() => {
    return buildDueChartData(filteredRawData);
  }, [filteredRawData]);

  const [stats, setStats] = useState({
    totalNotifications: '0',
    notif15Days: '0',
    m2Pending: '0',
    m1Pending: '0',
    overdue: '0',
    impactedUnits: '0',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [unitPerformance, setUnitPerformance] = useState([
    { name: 'Unit 1', val: 85, color: 'bg-indigo-600' },
    { name: 'Unit 2', val: 62, color: 'bg-amber-500' },
    { name: 'Unit 4', val: 94, color: 'bg-emerald-500' },
  ]);
  const paginatedNotifications =
    filteredNotifications.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  const totalPages = Math.ceil(
    filteredNotifications.length / rowsPerPage
  );
  const fileInputRef = useRef(null);
  const prevRawSignature = useRef('');
  useEffect(() => {
    // update stats only when rawData content changes (avoid unnecessary setState)
    const signature = rawData.length + '|' + (rawData[0] ? Object.keys(rawData[0]).join(',') : '');
    if (prevRawSignature.current !== signature) {
      const newStats = calculateKpiStats(rawData);
      setStats((prev) => {
        const p = JSON.stringify(prev);
        const n = JSON.stringify(newStats);
        return p === n ? prev : newStats;
      });
      prevRawSignature.current = signature;
    }
  }, [rawData]);

  const colorStyles = {
    indigo: { badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-600', badgeRing: 'ring-indigo-600/10', dot: 'bg-indigo-600' },
    rose: { badgeBg: 'bg-rose-50', badgeText: 'text-rose-700', badgeRing: 'ring-rose-600/10', dot: 'bg-rose-600' },
    amber: { badgeBg: 'bg-amber-50', badgeText: 'text-amber-600', badgeRing: 'ring-amber-600/10', dot: 'bg-amber-600' },
    emerald: { badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600', badgeRing: 'ring-emerald-600/10', dot: 'bg-emerald-600' },
    cyan: { badgeBg: 'bg-cyan-50', badgeText: 'text-cyan-600', badgeRing: 'ring-cyan-600/10', dot: 'bg-cyan-600' },
  };

  const handleSendEmail = (notification) => {
    if (!notification) return;
    const type = String(notification.type ?? '').trim().toUpperCase();
    const rawUnit = String(notification.workCtr ?? '').trim().toUpperCase();
    const status = String(notification.status ?? '').trim().toUpperCase();

    let prefix = '';
    let plantName = rawUnit;

    if (rawUnit.startsWith('MR') || rawUnit.startsWith('MS')) {
      prefix = rawUnit.substring(0, 2);
      plantName = rawUnit.substring(2).trim();
    }

    const plantConfig = emailConfig.find(p => p.plantName.toUpperCase() === plantName);
    let targetEmail = '';

    if (plantConfig) {
      const isProcessType = ['M1', 'M2', 'M6'].includes(type);
      const isProcessStatus = status === 'PENDING' || status.includes('APRE') || status.includes('JBCO');

      if (isProcessType && isProcessStatus) {
        targetEmail = plantConfig.processEmail;
      } else if (prefix === 'MR') {
        targetEmail = plantConfig.rotaryMail;
      } else if (prefix === 'MS') {
        targetEmail = plantConfig.staticMail;
      } else {
        // Fallback if not specifically process/rotary/static, but we can default to process or rotary based on config
        targetEmail = plantConfig.processEmail || plantConfig.rotaryMail || plantConfig.staticMail;
      }
    }

    if (targetEmail) {
      const subject = encodeURIComponent(`Notification Alert: ${notification.id} - ${notification.equip}`);
      const body = encodeURIComponent(`Hello,\n\nPlease review the following notification details:\n\nNotification ID: ${notification.id}\nEquipment: ${notification.equip}\nType: ${notification.type}\nStatus: ${notification.status}\nWork Center: ${notification.workCtr}\nRequired End: ${notification.requiredEnd}\n\nThank you.`);
      window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    } else {
      alert(`No email configuration found for plant: ${plantName} with prefix ${prefix}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };
  const processUploadedFile = async () => {
    if (!selectedFile) return;

    setShowUploadDialog(false);
    setUploadLoading(true);
    setProcessingPercent(0);
    setUploadMessage("Reading file...");

    const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 40));

    try {
      setProcessingPercent(10);
      await yieldToMain();

      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(selectedFile);
      });

      setUploadMessage("Parsing workbook...");
      setProcessingPercent(30);
      await yieldToMain();

      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      setUploadMessage("Extracting rows...");
      setProcessingPercent(50);
      await yieldToMain();

      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: true });
      const headers = allRows[0] || [];
      const visibleRows = [];

      for (let i = 1; i < allRows.length; i++) {
        const rowNum = range.s.r + i;
        const rowInfo = worksheet['!rows']?.[rowNum];
        if (rowInfo && (rowInfo.hidden === true || rowInfo.level !== undefined)) {
          continue;
        }
        visibleRows.push(allRows[i]);
      }

      setUploadMessage("Mapping columns...");
      setProcessingPercent(70);
      await yieldToMain();

      const jsonData = visibleRows.map((row) => {
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = row[idx]; });
        return obj;
      });

      if (!jsonData || jsonData.length === 0) {
        throw new Error('File appears to be empty');
      }

      const sample = jsonData[0] || {};
      const notificationKey = findKey(sample, ['Notification', 'Notification No', 'Notification Number']);
      const equipmentKey = findKey(sample, ['Equipment', 'Equipment Name', 'Equip']);
      const statusKey = findKey(sample, ['Status', 'User status']);
      const typeKey = findKey(sample, ['Type', 'Notification Type', 'Notif Type', 'NotificationType', 'Notifictn type']);
      const workCtrKey = findKey(sample, ['Main WorkCtr', 'MainWorkCtr', 'Unit']);
      const requiredEndKey = findKey(sample, ['Required End', 'RequiredEnd']);
      const notifDateKey = findKey(sample, ['Notif.date', 'Notification Date', 'Date']);
      const priorityKey = findKey(sample, ['Priority']);

      setUploadMessage("Building analytics...");
      setProcessingPercent(90);
      await yieldToMain();

      const updatedNotifications = jsonData
        .filter((row) => {
          const nk = findKey(row, ['Notification', 'Notification No', 'Notification Number']);
          return row[nk];
        })
        .map((row, idx) => {
          const parseDate = (val) => {
            if (!val) return 'N/A';
            let d;
            if (val instanceof Date) d = val;
            else if (typeof val === 'number') d = new Date((val - 25569) * 86400 * 1000);
            else d = new Date(String(val).trim());
            if (isNaN(d)) return String(val);
            return d.toISOString().split('T')[0];
          };

          return {
            id: row[notificationKey] || `N-${idx + 1}`,
            equip: row[equipmentKey] || 'Unknown equipment',
            status: (() => {
              const raw = String(row[statusKey] || '').toUpperCase();
              if (raw.includes('APRD')) return 'Approved';
              if (raw.includes('APRE')) return 'Pending';
              if (raw.includes('NOPR')) return 'In Progress';
              return raw || 'Pending';
            })(),
            type: row[typeKey] || 'N/A',
            workCtr: row[workCtrKey] || 'N/A',
            requiredEnd: parseDate(row[requiredEndKey]),
            notifDate: parseDate(row[notifDateKey]),
            priority: row[priorityKey] || 'Normal',
            color: ['rose', 'indigo', 'emerald', 'amber'][idx % 4],
          };
        });

      setProcessingPercent(100);
      setUploadMessage("Dashboard ready!");
      await yieldToMain();

      setNotifications(updatedNotifications);
      setCurrentPage(1);
      setRawData(jsonData);
      setSelectedFile(null);

      setTimeout(() => {
        setUploadLoading(false);
        setProcessingPercent(0);
        setUploadMessage("");
      }, 400);

    } catch (err) {
      console.error(err);
      setUploadMessage("Error: " + err.message);
      await yieldToMain();
      setTimeout(() => {
        setUploadLoading(false);
        setProcessingPercent(0);
        setUploadMessage("");
      }, 3000);
    }
  };
  return (
    <Layout>
      {/* Breadcrumbs & Actions */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto justify-end">
          {rawData.length > 0 && (
            <div className="w-full sm:w-64">
              <Select
  isMulti
  // Essential for Multi-Select UX:
  closeMenuOnSelect={false} 
  hideSelectedOptions={false}
  components={{
    Option: InputOption,
  }}
  
  options={ALL_TYPES.map((t) => ({ value: t, label: t }))}
  value={activeTypeFilter}
  onChange={(selected) => setActiveTypeFilter(selected || [])}
  placeholder="Filter type..."
  className="text-sm"
  styles={{
    control: (base) => ({
      ...base,
      minHeight: "42px",
      borderRadius: "12px",
      borderColor: "#e2e8f0",
      boxShadow: "none",
      "&:hover": { borderColor: "#cbd5e1" },
    }),
    multiValue: (base) => ({
      ...base,
      borderRadius: "8px",
      backgroundColor: "#eef2ff",
      padding: "2px 4px",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#4f46e5",
      fontWeight: 700,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#4f46e5",
      ":hover": {
        backgroundColor: "#e0e7ff",
        color: "#4338ca",
        borderRadius: "6px",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      border: "1px solid #e2e8f0",
    }),
    menuList: (base) => ({
      ...base,
      padding: "4px",
      "::-webkit-scrollbar": { width: "8px" },
      "::-webkit-scrollbar-track": { background: "transparent" },
      "::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "10px" },
      "::-webkit-scrollbar-thumb:hover": { background: "#94a3b8" },
    }),
  }}
/>
            </div>
          )}
          <button
            onClick={() => setShowGlobalEmailModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            Send Emails
          </button>
          <button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Upload File
          </button>
        </div>
      </div>
      {uploadLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl text-center">
            {/* Loader */}
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-5xl">
              📊
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-slate-900">
              Processing File
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Please wait while analytics are being generated...
            </p>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">
                  Processing
                </span>
                <span className="text-sm font-bold text-indigo-600">
                  {processingPercent}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{
                    width: `${processingPercent}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {rawData.length > 0 ? (
        <>

          {/* KPI Stats */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              {
                label: 'Total Notifications',
                value: stats.totalNotifications,
                detail: 'Open / pending',
                bgColor: 'bg-indigo-50',
                textColor: 'text-indigo-600',
                icon: '📊',
              },
              {
                label: 'Notif > 15 days',
                value: stats.notif15Days,
                detail: 'Older notifications',
                bgColor: 'bg-purple-50',
                textColor: 'text-purple-600',
                icon: '⏱️',
              },
              {
                label: 'Units impacted',
                value: stats.impactedUnits,
                detail: 'Unique locations',
                bgColor: 'bg-rose-50',
                textColor: 'text-rose-600',
                icon: '🏭',
              },
              {
                label: 'M2 Pending > 7 days',
                value: stats.m2Pending,
                detail: 'M2 overdue notifications',
                bgColor: 'bg-orange-50',
                textColor: 'text-orange-600',
                icon: '⏳',
              },
              {
                label: 'M1 Pending > 25 days',
                value: stats.m1Pending,
                detail: 'M1 overdue notifications',
                bgColor: 'bg-fuchsia-50',
                textColor: 'text-fuchsia-600',
                icon: '⚠️',
              },
            ].map((stat) => (
              <div key={stat.label} className={`group relative rounded-3xl ${stat.bgColor} p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 border border-white/50`}>
                <div className="absolute top-4 right-4">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-xl bg-white/70 shadow-sm ${stat.textColor} text-lg`}
                  >
                    {stat.icon}
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-600">{stat.label}</p>
                <div className="mt-1 flex items-end justify-between">
                  <h3 className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>
          {/* Charts Grid */}
          <div className="mt-8 grid gap-8 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm overflow-hidden">
              <NotificationTypeBarChart data={filteredRawData} />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col items-center justify-center">
              <MrMsPieChart data={filteredRawData} />
            </div>
          </div>

          {/* Static and Rotary Unit-wise Charts */}
          <div className="mt-8 grid gap-8 grid-cols-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm overflow-hidden">
              <UnitWiseBarChart title="Static Notification Unit Wise" prefix="MS" data={filteredRawData} />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm overflow-hidden">
              <UnitWiseBarChart title="Rotary Notification Unit Wise" prefix="MR" data={filteredRawData} />
            </div>
          </div>

          {/* Total Due Notifications Chart */}

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm overflow-hidden">

            <div className="mb-6">

              <h3 className="text-xl font-bold text-slate-900">
                Total Due Notifications
              </h3>

              <p className="text-sm text-slate-500">
                MR vs MS notification comparison by unit
              </p>
            </div>
            <>
              <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">

                <div className="min-w-[600px] h-[400px] sm:h-[470px]">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={dueChartData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                      barCategoryGap={18}
                    >
                      {/* Gradient */}
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
                        horizontal={false}
                        vertical={true}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="unit"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tick={({ x, y, payload }) => (

                          <g transform={`translate(${x},${y})`}>

                            {/* MR MS Row */}
                            <text
                              x={-18}
                              y={18}
                              textAnchor="middle"
                              fill="#2563eb"
                              fontSize="11"
                              fontWeight="700"
                            >
                              MS
                            </text>
                            <text
                              x={18}
                              y={18}
                              textAnchor="middle"
                              fill="#f59e0b"
                              fontSize="11"
                              fontWeight="700"
                            >
                              MR
                            </text>

                            {/* UNIT NAME */}
                            <text
                              x={0}
                              y={38}
                              textAnchor="middle"
                              fill="#334155"
                              fontSize="13"
                              fontWeight="700"
                            >
                              {payload.value}
                            </text>
                          </g>
                        )}
                      />
                      <YAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: '#64748b',
                          fontSize: 12,
                        }}
                      />

                      <Tooltip
                        cursor={{
                          fill: 'rgba(99,102,241,0.06)',
                        }}
                        contentStyle={{
                          borderRadius: '14px',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <Bar
                        dataKey="MS"
                        fill="url(#notificationBarGradient)"
                        radius={[10, 10, 0, 0]}
                        barSize={28}
                      />
                      <Bar
                        dataKey="MR"
                        fill="#f59e0b"
                        radius={[10, 10, 0, 0]}
                        barSize={28}
                      />
                    </BarChart>

                  </ResponsiveContainer>
                </div>
              </div>
            </>
          </div>
          {/* Main Content Grid */}
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
          </div>        </>
      ) : (
        <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-gray-100 px-10 py-24 text-center shadow-sm">
          {/* Icon */}
          <div className="mb-6 rounded-full bg-indigo-100 p-6 text-5xl">
            📊
          </div>
          {/* Heading */}
          <h2 className="text-3xl font-bold text-slate-900">
            No Analytics Available
          </h2>
          {/* Description */}
          <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-800">
            Upload an Excel file to start analytics,
            generate KPIs, visualize charts,
            and monitor machine notifications.
          </p>
          {/* Upload Button */}
          <button
            onClick={() => setShowUploadDialog(true)}
            className="mt-8 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            Upload Excel File
          </button>
          {/* Features */}
          <div className="mt-10 grid gap-4 text-sm text-slate-400 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
              📈 KPI Metrics
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
              📊 Charts & Analytics
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
              🔔 Notification Tables
            </div>
          </div>
        </div>
      )
      }
      {selectedNotification && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">

            {/* Header */}

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Notification Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Detailed information about selected notification
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedNotification(null)
                }
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>

            </div>

            {/* Content */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Notification ID
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {selectedNotification.id}
                </p>

              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Equipment
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {selectedNotification.equip}
                </p>

              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Status
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {selectedNotification.status}
                </p>

              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Priority
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {selectedNotification.priority}
                </p>

              </div>

            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">

              <span className="text-sm font-bold text-slate-500">
                Type
              </span>

              <span className="text-sm font-bold text-slate-900">
                {selectedNotification.type}
              </span>

            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">

              <span className="text-sm font-bold text-slate-500">
                WorkCtr
              </span>

              <span className="text-sm font-bold text-slate-900">
                {selectedNotification.workCtr}
              </span>

            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">

              <span className="text-sm font-bold text-slate-500">
                Required End
              </span>

              <span className="text-sm font-bold text-slate-900">
                {String(selectedNotification.requiredEnd)}
              </span>

            </div>

            {/* Footer */}

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => handleSendEmail(selectedNotification)}
                className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Send Email
              </button>

              <button
                onClick={() =>
                  setSelectedNotification(null)
                }
                className="rounded-2xl bg-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}
      {/* Upload Dialog Modal */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900">
                Upload Data File
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Upload Excel file for dashboard analytics
              </p>
            </div>
            {/* Upload Area */}
            <div className="mb-5">
              <div
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
              >
                <svg
                  className="mx-auto mb-3 h-12 w-12 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm font-bold text-slate-900">
                  Click to upload or drag and drop
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Excel files (.xlsx, .xls)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {/* File Preview */}
            {selectedFile && (
              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      📄
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-sm font-bold text-rose-500 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                disabled={uploadLoading}
                onClick={() => {
                  if (!selectedFile) {
                    fileInputRef.current?.click();
                  } else {
                    processUploadedFile();
                  }
                }}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all"
              >
                {uploadLoading
                  ? "Processing File..."
                  : selectedFile
                    ? "Process File"
                    : "Select File"}
              </button>
              <button
                onClick={() =>
                  setShowUploadDialog(false)
                }
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Email Modal */}
      <SendEmailModal
        isOpen={showGlobalEmailModal}
        onClose={() => setShowGlobalEmailModal(false)}
        notifications={notifications}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
    </Layout>
  );
};
export default Dashboard;
