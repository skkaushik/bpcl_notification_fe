import Layout from "../../components/Layout";
import NotificationTypeBarChart from "../../components/NotificationTypeBarChart";
import UnitWiseBarChart from "../../components/UnitWiseBarChart";
import SendEmailModal from "../../components/SendEmailModal";
import MrMsPieChart from "../../components/MrMsPieChart";
import { useState, useRef, useEffect, useMemo } from "react";
import { BsUpload, BsEnvelope } from "react-icons/bs";
import * as XLSX from "xlsx";
import { ALL_TYPES } from "../../components/NotificationTypeFilter";
import { emailConfig } from "../../data/emailConfig";
import DataTable from "react-data-table-component";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
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

// Helper function to convert camelCase to Title Case
const camelToTitleCase = (text) => {
  if (!text || typeof text !== 'string') return text;
  // Add space before capital letters, then capitalize first letter of each word
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};
const formatExcelDate = (val) => {
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

    if (
      !rawUnit.startsWith('MR') &&
      !rawUnit.startsWith('MS')
    ) {
      return false;
    }

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

    if (
      value === '' ||
      value === null ||
      value === undefined
    ) {
      return false;
    }
    let requiredDate;

    if (value instanceof Date) {
      requiredDate = value;
    }

    else if (typeof value === 'number') {

      requiredDate = new Date(
        (value - 25569) * 86400 * 1000
      );
    }

    else {
      requiredDate = new Date(
        String(value).trim()
      );
    }

    if (isNaN(requiredDate)) {
      return false;
    }
    return requiredDate < today;
  }).length;
  const unitSet = new Set();

  data.forEach((row) => {

    const rawUnit = String(
      row[unitKey] ?? ''
    )
      .trim()
      .toUpperCase();

    if (!rawUnit) return;

    if (
      !rawUnit.startsWith('MR') &&
      !rawUnit.startsWith('MS')
    ) {
      return;
    }

    let cleanedUnit = rawUnit.substring(2);

    cleanedUnit = cleanedUnit.trim();

    if (!cleanedUnit) return;

    unitSet.add(cleanedUnit);

  });

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

    if (!rawWorkCtr) return;

    if (
      !rawWorkCtr.startsWith('MR') &&
      !rawWorkCtr.startsWith('MS')
    ) {
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

const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showGlobalEmailModal, setShowGlobalEmailModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [processingPercent, setProcessingPercent] = useState(0);

  const getWidthClass = (percent) => {
    const map = {
      0: "w-0",
      10: "w-[10%]",
      30: "w-[30%]",
      50: "w-[50%]",
      70: "w-[70%]",
      90: "w-[90%]",
      100: "w-full",
    };
    return map[percent] || "w-0";
  };
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [activeTypeFilter, setActiveTypeFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const typeKeyInData = useMemo(() => {
    if (!rawData.length) return null;
    const sample = rawData[0];
    const keys = Object.keys(sample);
    return keys.find((k) => {
      const n = k.replace(/\s+/g, '').toLowerCase();
      return n.includes('notificationtype') || n.includes('notifictntype') || n === 'type';
    }) || null;
  }, [rawData]);

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

  const dueChartData = useMemo(() => {
    return buildDueChartData(filteredRawData);
  }, [filteredRawData]);
  const criticalEquipmentData = useMemo(() => {
    if (!rawData.length) return [];

    const sample = rawData[0];
    const equipmentKey = findKey(sample, ["Equipment", "Equipment ID", "Equip"]);
    const typeKey = findKey(sample, ["Notifictn type", "Notification Type", "Type"]);
    const workCtrKey = findKey(sample, ["Main WorkCtr", "MainWorkCtr"]);
    const dateKey = findKey(sample, ["Notif.date", "Notification Date", "Date"]);
    const notificationIdKey = findKey(sample, ["Notification", "Notification No"]);
    const statusKey = findKey(sample, ["Status", "User status"]);
    const priorityKey = findKey(sample, ["Priority", "priority"]);
    const reportedByKey = findKey(sample, ["Reported By", "ReportedBy", "Reported by", "reportedby"]);
    const desc1Key = Object.keys(sample).find((k) => k.toLowerCase() === "description");
    const desc2Key = Object.keys(sample).find((k) => k.toLowerCase() === "description2" || k.toLowerCase() === "description 2");

    if (!equipmentKey || !workCtrKey) return [];

    const equipmentCounts = {};
    const equipmentMap = {};
    rawData.forEach((row) => {
      const rawWorkCtr = String(row[workCtrKey] || "").trim().toUpperCase();
      if (rawWorkCtr.startsWith("MR") || rawWorkCtr.startsWith("MS")) {
        const id = String(row[equipmentKey] || "").trim();
        if (id) {
          equipmentCounts[id] = (equipmentCounts[id] || 0) + 1;
          if (!equipmentMap[id]) equipmentMap[id] = [];

          equipmentMap[id].push({
            ...row,
            displayId: row[notificationIdKey] || "N/A",
            displayEquipId: id,
            displayType: row[typeKey],
            displayUnitType: rawWorkCtr.startsWith("MR") ? "MR" : "MS",
            displayDate: formatExcelDate(row[dateKey]),
            displayStatus: row[statusKey] || "N/A",
            displayPriority: priorityKey ? (String(row[priorityKey] || "").trim() || "N/A") : "N/A",
            displayReportedBy: reportedByKey ? (String(row[reportedByKey] || "").trim() || "N/A") : "N/A",
            displayDesc1: desc1Key ? (String(row[desc1Key] || "").trim() || "") : "",
            displayDesc2: desc2Key ? (String(row[desc2Key] || "").trim() || "") : "",
          });
        }
      }
    });

    const groupedData = [];
    Object.entries(equipmentMap).forEach(([id, notifications]) => {
      if (notifications.length > 1) {
        const uniqueTypes = [...new Set(notifications.map(n => String(n.displayType)))].join(', ');
        const uniquePriorities = [...new Set(notifications.map(n => String(n.displayPriority)).filter(p => p && p !== 'N/A'))].join(', ') || 'N/A';
        groupedData.push({
          displayEquipId: id,
          displayType: uniqueTypes,
          displayUnitType: notifications[0].displayUnitType,
          displayPriority: uniquePriorities,
          notificationCount: notifications.length,
          notifications: notifications,
        });
      }
    });

    return groupedData;
  }, [rawData]);
  const filteredCriticalEquipmentData = useMemo(() => {
    if (!searchQuery) return criticalEquipmentData;
    const lowerQuery = searchQuery.toLowerCase();
    return criticalEquipmentData.filter(row => {
      return (
        String(row.displayEquipId).toLowerCase().includes(lowerQuery) ||
        String(row.displayType).toLowerCase().includes(lowerQuery) ||
        String(row.displayUnitType).toLowerCase().includes(lowerQuery)
      );
    });
  }, [criticalEquipmentData, searchQuery]);

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#EEF2FF',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        borderBottomWidth: '1px',
        borderBottomColor: '#E0E7FF',
        minHeight: '56px',
      },
    },
    headCells: {
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#3730A3',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
    },
    rows: {
      style: {
        minHeight: '64px',
        fontSize: '14px',
        color: '#334155',
        backgroundColor: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#F8FAFC',
          cursor: 'pointer',
        },
      },
      stripedStyle: {
        color: '#334155',
        backgroundColor: '#F8FAFC',
      },
    },
    pagination: {
      style: {
        borderTopWidth: '1px',
        borderTopColor: '#E2E8F0',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
      },
    },
  };

  const criticalEquipmentColumns = [
    {
      name: "Equipment ID",
      selector: row => row.displayEquipId,
      sortable: true,
    },
    {
      name: "Notification Type",
      selector: row => row.displayType,
      sortable: true,
    },
    {
      name: "Unit Type",
      selector: row => row.displayUnitType,
      sortable: true,
    },
    {
      name: "Total Count",
      selector: row => row.notificationCount,
      sortable: true,
      cell: row => (
        <span className="inline-flex items-center justify-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
          {row.notificationCount}
        </span>
      ),
    },
    {
      name: "Priority",
      selector: row => row.displayPriority,
      sortable: true,
      cell: row => (
        <span className="inline-flex items-center justify-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
          {row.displayPriority || 'N/A'}
        </span>
      ),
    },
  ];
  const [stats, setStats] = useState({
    totalNotifications: '0',
    notif15Days: '0',
    m2Pending: '0',
    m1Pending: '0',
    overdue: '0',
    impactedUnits: '0',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('data-loaded', { detail: rawData }));
  }, [rawData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedEquipment(null);
        setShowUploadDialog(false);
        setShowGlobalEmailModal(false);
        setSelectedNotification(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);



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
      const isProcessStatus = status === 'PENDING' || status.includes('APRE') || status.includes('JBCO') || status.includes('JBPR');

      if (isProcessType && isProcessStatus) {
        targetEmail = plantConfig.processEmail;
      } else if (prefix === 'MR') {
        targetEmail = plantConfig.rotaryMail;
      } else if (prefix === 'MS') {
        targetEmail = plantConfig.staticMail;
      } else {

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
            status: String(row[statusKey] || '').toUpperCase().trim() || 'N/A',
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
    <Layout hasData={rawData.length > 0}>

      <div className="px-8 py-6">
        {uploadLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl text-center">

              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-5xl">
                📊
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Processing File
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Please wait while analytics are being generated...
              </p>

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
                    className={`h-full rounded-full bg-indigo-600 transition-all duration-300 ${getWidthClass(processingPercent)}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {rawData.length > 0 ? (
          <>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">

              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-bold uppercase tracking-wide text-slate-800 mr-2"> Notification Type:</span>
                <button
                  onClick={() => {
                    setActiveTypeFilter([]);
                  }}
                  className={`cursor-pointer
                    px-3
                    py-2
                    rounded-xl
                    text-sm
                    font-semibold
                    transition-all
                    duration-300
                    border-2
                    shadow-sm
                    hover:-translate-y-0.5
                    hover:shadow-md
                    ${(activeTypeFilter.length === 0 || activeTypeFilter.length === ALL_TYPES.length)
                      ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                >
                  All
                </button>
                {ALL_TYPES.map((type) => {
                  const isSelected = activeTypeFilter.some((item) => item.value === type);
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (activeTypeFilter.length === 0 || activeTypeFilter.length === ALL_TYPES.length) {
                          setActiveTypeFilter([{ value: type, label: type }]);
                        } else if (activeTypeFilter.some((item) => item.value === type)) {
                          setActiveTypeFilter(activeTypeFilter.filter((item) => item.value !== type));
                        } else {
                          setActiveTypeFilter([...activeTypeFilter, { value: type, label: type }]);
                        }
                      }}
                      className={`cursor-pointer
                        px-3
                        py-2
                        rounded-xl
                        text-sm
                        font-semibold
                        transition-all
                        duration-300
                        border-2
                        shadow-sm
                        hover:-translate-y-0.5
                        hover:shadow-md
                        ${isSelected
                          ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                    >
                      {type}
                    </button>
                  );
                })}
                {activeTypeFilter.length > 0 && activeTypeFilter.length !== ALL_TYPES.length && (
                  <button
                    onClick={() => setActiveTypeFilter([])}
                    className="cursor-pointer px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2 ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>


              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUploadDialog(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border-2 border-purple-200 bg-white px-4 h-[42px] text-sm font-semibold text-purple-700 hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm"
                >
                  <BsUpload className="text-purple-600 text-base" />
                  Upload New File
                </button>
                <button
                  onClick={() => setShowGlobalEmailModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-4 h-[42px] text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-all"
                >
                  <BsEnvelope className="text-white text-base" />
                  Send Emails
                </button>
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
              {[
                {
                  label: 'Total Notifications',
                  value: stats.totalNotifications,
                  textColor: 'text-[#2563EB]',
                  iconBg: 'bg-[#DBEAFE]',
                  bgColor: 'bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]/40',
                  borderColor: 'border-[#BFDBFE]',
                  icon: '📊',
                },
                {
                  label: 'Notif > 15 days',
                  value: stats.notif15Days,
                  textColor: 'text-[#7C3AED]',
                  iconBg: 'bg-[#EDE9FE]',
                  bgColor: 'bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE]/40',
                  borderColor: 'border-[#DDD6FE]',
                  icon: '⏱️',
                },
                {
                  label: 'Units impacted',
                  value: stats.impactedUnits,
                  textColor: 'text-[#DC2626]',
                  iconBg: 'bg-[#FEE2E2]',
                  bgColor: 'bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2]/40',
                  borderColor: 'border-[#FECACA]',
                  icon: '🏭',
                },
                {
                  label: 'M2 Pending > 7 days',
                  value: stats.m2Pending,
                  textColor: 'text-[#EA580C]',
                  iconBg: 'bg-[#FFEDD5]',
                  bgColor: 'bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5]/40',
                  borderColor: 'border-[#FED7AA]',
                  icon: '⏳',
                },
                {
                  label: 'M1 Pending > 25 days',
                  value: stats.m1Pending,
                  textColor: 'text-[#D97706]',
                  iconBg: 'bg-[#FEF3C7]',
                  bgColor: 'bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]/40',
                  borderColor: 'border-[#FDE68A]',
                  icon: '⚠️',
                },
              ].map((stat) => (
                <div key={stat.label} className={`group flex flex-col justify-between ${stat.bgColor} rounded-[20px] p-[20px] shadow-md border border-slate-100/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg} ${stat.textColor} text-base`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="flex items-baseline mt-2">
                    <h3 className={`text-4xl font-black tracking-tight ${stat.textColor}`}>{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-[24px] shadow-sm overflow-hidden">
                <NotificationTypeBarChart data={filteredRawData} />
              </div>
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-[24px] shadow-sm overflow-hidden flex flex-col items-center justify-center">
                <MrMsPieChart data={filteredRawData} />
              </div>
            </div>

            <div className="mt-8 grid gap-8 grid-cols-1 lg:grid-cols-2">
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-[24px] shadow-sm overflow-hidden">
                <UnitWiseBarChart title="Static Notification Unit Wise" prefix="MS" data={filteredRawData} />
              </div>
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-[24px] shadow-sm overflow-hidden">
                <UnitWiseBarChart title="Rotary Notification Unit Wise" prefix="MR" data={filteredRawData} />
              </div>
            </div>

            <div className="mt-8 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-[24px] shadow-sm overflow-hidden">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Total Due Notifications
                  </h3>
                  <p className="text-sm text-slate-500">
                    MR vs MS notification comparison by unit (Area Chart)
                  </p>
                </div>
              </div>
              <div className="w-full">
                <div className="w-full h-[320px] sm:h-[470px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="msAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="mrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
                      <YAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0' }} />
                      <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="MS" name="MS (Static)" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#msAreaGrad)" />
                      <Area type="monotone" dataKey="MR" name="MR (Rotary)" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#mrAreaGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={`mt-8 transition-all duration-300 ${selectedEquipment ? 'flex flex-col gap-6 xl:flex-row xl:items-start' : ''}`}>
              <div className={`${selectedEquipment ? 'w-full xl:flex-1 xl:min-w-0' : 'w-full'} bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-[24px] shadow-sm overflow-hidden transition-all duration-300`}>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Critical Equipment Details
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Overview of critical equipment notifications
                    </p>
                  </div>
                  <div className="w-full sm:w-72">
                    <input
                      type="text"
                      placeholder="Search equipment, type, unit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <DataTable
                    columns={criticalEquipmentColumns}
                    data={filteredCriticalEquipmentData}
                    customStyles={{
                      ...customStyles,
                      rows: {
                        ...customStyles.rows,
                        style: {
                          ...customStyles.rows.style,
                          cursor: 'pointer',
                        },
                      },
                    }}
                    onRowClicked={(row) => setSelectedEquipment(prev => prev && prev.displayEquipId === row.displayEquipId ? null : row)}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20, 30, 50]}
                    striped
                    highlightOnHover
                    responsive
                    fixedHeader
                    fixedHeaderScrollHeight="650px"
                    noDataComponent={
                      <div className="p-8 text-center text-slate-500">No critical equipment found</div>
                    }
                  />
                </div>
              </div>

              {selectedEquipment && (
                <div className="animate-drawer-from-right w-full bg-white border border-[#E5E7EB] rounded-[24px] shadow-lg overflow-hidden flex flex-col transition-all duration-300 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:w-[520px] 2xl:w-[600px] xl:shrink-0">
                  <div className="flex-shrink-0 p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Equipment Details</h2>
                      <p className="text-indigo-600 font-semibold text-sm mt-1">ID: {selectedEquipment.displayEquipId}</p>
                    </div>
                    <button onClick={() => setSelectedEquipment(null)} className="rounded-full bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 tracking-wider">Notification History</h3>
                      {selectedEquipment.notifications.map((notif, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs font-bold text-slate-400 mb-0.5">Notification ID</p>
                              <p className="text-sm font-bold text-slate-900">{notif.displayId}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-400 mb-0.5">Date</p>
                              <p className="text-sm font-bold text-slate-900">{notif.displayDate}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 mb-4">
                            <div>
                              <p className="text-xs font-bold text-slate-400 mb-1">Notification Type</p>
                              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                                {camelToTitleCase(notif.displayType)}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 mb-1">System Status</p>
                              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-600">
                                {camelToTitleCase(notif.displayStatus)}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 mb-1">Unit</p>
                              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600">
                                {camelToTitleCase(notif.displayUnitType)}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 mb-1">Priority</p>
                              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-violet-50 text-violet-700">
                                {camelToTitleCase(notif.displayPriority)}
                              </span>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-xs font-bold text-slate-400 mb-1">Reported By</p>
                            <p className="text-sm font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                              {camelToTitleCase(notif.displayReportedBy)}
                            </p>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-bold text-slate-400 mb-2">Description</p>
                            <div className="text-sm text-black leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                              {notif.displayDesc1 && notif.displayDesc2 ? (
                                <>
                                  <div className="flex items-start">
                                    <span className="text-slate-500 mr-2 mt-0.5">•</span>
                                    <span>{camelToTitleCase(notif.displayDesc1)}</span>
                                  </div>
                                  <div className="flex items-start">
                                    <span className="text-slate-500 mr-2 mt-0.5">•</span>
                                    <span>{camelToTitleCase(notif.displayDesc2)}</span>
                                  </div>
                                </>
                              ) : notif.displayDesc1 ? (
                                <div className="flex items-start">
                                  <span className="text-slate-500 mr-2 mt-0.5">•</span>
                                  <span>{camelToTitleCase(notif.displayDesc1)}</span>
                                </div>
                              ) : notif.displayDesc2 ? (
                                <div className="flex items-start">
                                  <span className="text-slate-500 mr-2 mt-0.5">•</span>
                                  <span>{camelToTitleCase(notif.displayDesc2)}</span>
                                </div>
                              ) : (
                                <div className="text-slate-500 italic">No description provided</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-gray-100 px-10 py-24 text-center shadow-sm">

            <div className="mb-6 rounded-full bg-indigo-100 p-6 text-5xl">
              📊
            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              No Analytics Available
            </h2>

            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-800">
              Upload an Excel file to start analytics,
              generate KPIs, visualize charts,
              and monitor machine notifications.
            </p>

            <button
              onClick={() => setShowUploadDialog(true)}
              className="mt-8 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              Upload Excel File
            </button>

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
        )}
        {selectedNotification && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

            <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <h2 className="text-2xl font-normal text-slate-900">
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

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                  <p className="text-xs font-bold tracking-widest text-slate-400">
                    Notification ID
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {selectedNotification.id}
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                  <p className="text-xs font-bold tracking-widest text-slate-400">
                    Equipment
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {selectedNotification.equip}
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                  <p className="text-xs font-bold tracking-widest text-slate-400">
                    Status
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {selectedNotification.status}
                  </p>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                    <p className="text-xs font-bold tracking-widest text-slate-400">
                      Priority
                    </p>

                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {selectedNotification.priority}
                    </p>

                  </div>
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
      </div>

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
