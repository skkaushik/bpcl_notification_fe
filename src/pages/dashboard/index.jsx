import Layout from "../../components/Layout";
import NotificationTypeBarChart from "../../components/NotificationTypeBarChart";
import UnitWiseBarChart from "../../components/UnitWiseBarChart";
import MrMsPieChart from "../../components/MrMsPieChart";
import TotalDueNotificationsChart from "../../components/TotalDueNotificationsChart";
import UploadDataDialog from "../../components/UploadDataDialog";
import KpiSection from "../../components/KpiSection";
import ProcessingOverlay from "../../components/ProcessingOverlay";
import NotificationDetailsModal from "../../components/NotificationDetailsModal";
import EmptyDashboardState from "../../components/EmptyDashboardState";
import CriticalEquipmentTable from "../../components/CriticalEquipmentTable";
import EquipmentDetailsDrawer from "../../components/EquipmentDetailsDrawer";
import TopEquipmentBarChart from "../../components/TopEquipmentBarChart";
import { useState, useRef, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { ALL_TYPES } from "../../components/NotificationTypeFilter";
import { emailConfig } from "../../data/emailConfig";
import {
  findKey,
  formatExcelDate,
  calculateKpiStats,
  buildDueChartData,
} from "../../utils/dashboardHelpers";

const Dashboard = () => {
  const DEPARTMENTS = ["MR", "MS", "MI", "ME", "FS", "MC", "OTHERS"];
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [rawData, setRawData] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('rawData');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [processingPercent, setProcessingPercent] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [activeTypeFilter, setActiveTypeFilter] = useState([]);
  const [activeUnitFilter, setActiveUnitFilter] = useState([]);
  const [activeDeptFilter, setActiveDeptFilter] = useState([]);
  const [activeUserStatusFilter, setActiveUserStatusFilter] = useState([]);
  const [activeSystemStatusFilter, setActiveSystemStatusFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDateFilter, endDateFilter] = dateRange;
  const [ageFilter, setAgeFilter] = useState(0);

  const USER_STATUSES = ["APRD", "APRE", "APRJ", "JBCO", "JBPR", "(Blanks)"];
  const SYS_STATUSES = ["NOPR", "NOPR ORAS", "OSNO"];
  const USER_STATUS_ROWS = [
    ["APRD", "APRE", "APRJ"],
    ["JBCO", "JBPR", "(Blanks)"],
  ];
  const SYS_STATUS_ROWS = [
    ["NOPR", "OSNO"],
    ["NOPR ORAS"],
  ];

  const availableUnits = useMemo(() => {
    if (!rawData.length) return [];
    const sample = rawData[0];
    const workCtrKey = findKey(sample, ["Main WorkCtr", "MainWorkCtr", "Unit"]);
    if (!workCtrKey) return [];

    const units = new Set();
    rawData.forEach(row => {
      const rawUnit = String(row[workCtrKey] || "").trim().toUpperCase();
      const DEPARTMENTS = ["MR", "MS", "MI", "ME", "FS", "MC", "OTHERS"];

      if (
        DEPARTMENTS.some(prefix =>
          rawUnit.startsWith(prefix)
        )
      ) {
        units.add(rawUnit.substring(2).trim());
      }
    });
    return Array.from(units).sort();
  }, [rawData]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    const allUnitsSelected = availableUnits.length > 0 && activeUnitFilter.length === availableUnits.length;
    const allTypesSelected = activeTypeFilter.length === ALL_TYPES.length;
    const DEPARTMENTS = ["MR", "MS", "MI", "ME", "FS", "MC"];
    const allDeptsSelected =
      activeDeptFilter.length === DEPARTMENTS.length;
    const allUserStatusSelected = activeUserStatusFilter.length === USER_STATUSES.length;
    const allSysStatusSelected = activeSystemStatusFilter.length === SYS_STATUSES.length;

    if (activeUnitFilter.length && !allUnitsSelected) count += 1;
    if (activeTypeFilter.length && !allTypesSelected) count += 1;
    if (activeDeptFilter.length && !allDeptsSelected) count += 1;
    if (activeUserStatusFilter.length && !allUserStatusSelected) count += 1;
    if (activeSystemStatusFilter.length && !allSysStatusSelected) count += 1;
    if (dateRange[0] || dateRange[1]) count += 1;
    if (ageFilter > 0) count += 1;
    return count;
  }, [activeUnitFilter, activeTypeFilter, activeDeptFilter, activeUserStatusFilter, activeSystemStatusFilter, dateRange, ageFilter, availableUnits.length]);

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
    let result = rawData;

    if (activeTypeFilter.length > 0 && typeKeyInData) {
      const selectedValues = activeTypeFilter.map((item) => item.value);
      result = result.filter((row) =>
        selectedValues.includes(
          String(row[typeKeyInData] ?? '')
            .trim()
            .toUpperCase()
            .replace(/\s+/g, '')
        )
      );
    }

    if (activeUnitFilter.length > 0) {
      const sample = rawData[0] || {};
      const workCtrKey = findKey(sample, ["Main WorkCtr", "MainWorkCtr", "Unit"]);
      if (workCtrKey) {
        result = result.filter((row) => {
          const rawUnit = String(row[workCtrKey] || "").trim().toUpperCase();
          let plantName = rawUnit;
          const DEPARTMENTS = ["MR", "MS", "MI", "ME", "FS", "MC"];
          if (
            DEPARTMENTS.some(prefix =>
              rawUnit.startsWith(prefix)
            )
          ) {
            plantName = rawUnit.substring(2).trim();
          }
          return activeUnitFilter.includes(plantName);
        });
      }
    }

    if (
      activeDeptFilter.length > 0 &&
      activeDeptFilter.length < DEPARTMENTS.length
    ) {
      const sample = rawData[0] || {};
      const workCtrKey = findKey(sample, ["Main WorkCtr", "MainWorkCtr", "Unit"]);
      if (workCtrKey) {
        result = result.filter((row) => {
          const rawUnit = String(row[workCtrKey] || "").trim().toUpperCase();
          const prefix = rawUnit.substring(0, 2);
          return activeDeptFilter.includes(prefix);
        });
      }
    }

    if (activeUserStatusFilter.length > 0) {
      const sample = rawData[0] || {};
      const statusKey = findKey(sample, ['Status', 'User status']);
      if (statusKey) {
        result = result.filter((row) => {
          const rawStatus = String(row[statusKey] || "").trim().toUpperCase();
          return activeUserStatusFilter.some(filterStatus => {
            if (filterStatus === '(Blanks)' && !rawStatus) return true;
            return rawStatus.includes(filterStatus.toUpperCase());
          });
        });
      }
    }

    if (activeSystemStatusFilter.length > 0) {
      const sample = rawData[0] || {};
      const sysStatusKey = findKey(sample, ['System status', 'Systemstatus', 'System Status']);
      if (sysStatusKey) {
        result = result.filter((row) => {
          const rawSysStatus = String(row[sysStatusKey] || "").trim().toUpperCase();
          return activeSystemStatusFilter.some(filterStatus => {
            // Use exact match or bounded match to prevent NOPR matching NOPR ORAS
            if (filterStatus === 'NOPR' && rawSysStatus.includes('NOPR ORAS')) return false;
            return rawSysStatus.includes(filterStatus.toUpperCase());
          });
        });
      }
    }

    const hasFullDateRange = startDateFilter && endDateFilter;
    if (hasFullDateRange || Number(ageFilter) > 0) {
      const sample = rawData[0] || {};
      const notifDateKey = findKey(sample, ['Notif.date', 'Notification Date', 'Date']);

      if (notifDateKey) {
        result = result.filter((row) => {
          let passDate = true;
          let passAge = true;

          let val = row[notifDateKey];
          let d = null;
          if (val) {
            if (val instanceof Date) d = val;
            else if (typeof val === 'number') d = new Date((val - 25569) * 86400 * 1000);
            else d = new Date(String(val).trim());
          }

          const notifDate = d && !isNaN(d) ? d : null;

          if (notifDate) {
            if (hasFullDateRange) {
              const start = new Date(startDateFilter);
              start.setHours(0, 0, 0, 0);
              const end = new Date(endDateFilter);
              end.setHours(23, 59, 59, 999);
              passDate = notifDate >= start && notifDate <= end;
            }
            if (Number(ageFilter) > 0) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const notificationDate = new Date(notifDate);
              notificationDate.setHours(0, 0, 0, 0);
              const diffDays = Math.floor(
                (today - notificationDate) / (1000 * 60 * 60 * 24)
              ) + 1;
              passAge = diffDays >= Number(ageFilter);
            }
          } else {
            passDate = false;
            passAge = false;
          }

          if (!hasFullDateRange) passDate = true;
          if (!ageFilter || Number(ageFilter) <= 0) passAge = true;

          return passDate && passAge;
        });
      }
    }

    return result;
  }, [rawData, activeTypeFilter, typeKeyInData, activeUnitFilter, activeDeptFilter, activeUserStatusFilter, activeSystemStatusFilter, startDateFilter, endDateFilter, ageFilter]);



  const dueChartData = useMemo(() => {
    return buildDueChartData(filteredRawData);
  }, [filteredRawData]);
  const criticalEquipmentData = useMemo(() => {
    const DEPARTMENTS = [
      "MR",
      "MS",
      "MI",
      "ME",
      "FS",
      "MC",
      "OTHERS"
    ];
    if (!filteredRawData.length) return [];

    const sample = filteredRawData[0];
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
    filteredRawData.forEach((row) => {
      const rawWorkCtr = String(row[workCtrKey] || "")
        .trim()
        .toUpperCase();

      const isValidDept = DEPARTMENTS.some(
        dept => rawWorkCtr.startsWith(dept)
      );

      if (isValidDept) {
        const id = String(row[equipmentKey] || "").trim();
        if (id) {
          equipmentCounts[id] = (equipmentCounts[id] || 0) + 1;
          if (!equipmentMap[id]) equipmentMap[id] = [];

          equipmentMap[id].push({
            ...row,
            displayId: row[notificationIdKey] || "N/A",
            displayEquipId: id,
            displayType: row[typeKey],
            displayUnitType:
              DEPARTMENTS.find(dept =>
                rawWorkCtr.startsWith(dept)
              ) || "N/A",
            displayUnitName: String(row[workCtrKey] || "").trim(),
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
        const uniqueNotificationIds = [...new Set(notifications.map(n => String(n.displayId)))].join(', ');
        const uniqueUnitNames = [...new Set(notifications.map(n => String(n.displayUnitName)))].join(', ');

        groupedData.push({
          displayEquipId: id,
          displayNotificationIds: uniqueNotificationIds,
          displayType: uniqueTypes,
          displayUnitType: notifications[0].displayUnitType,
          displayUnitName: uniqueUnitNames || 'N/A',
          displayPriority: uniquePriorities,
          notificationCount: notifications.length,
          notifications: notifications,
        });
      }
    });

    return groupedData;
  }, [filteredRawData]);
  const filteredCriticalEquipmentData = useMemo(() => {
    if (!searchQuery) return criticalEquipmentData;
    const lowerQuery = searchQuery.toLowerCase();
    return criticalEquipmentData.filter(row => {
      return (
        String(row.displayEquipId).toLowerCase().includes(lowerQuery) ||
        String(row.displayType).toLowerCase().includes(lowerQuery) ||
        String(row.displayUnitName).toLowerCase().includes(lowerQuery) ||
        String(row.displayNotificationIds).toLowerCase().includes(lowerQuery)
      );
    });
  }, [criticalEquipmentData, searchQuery]);
const [selectedEquipment, setSelectedEquipment] = useState(null);
  const displayedCriticalEquipmentData = useMemo(() => {
    if (!selectedEquipment) {
      return filteredCriticalEquipmentData;
    }

    return filteredCriticalEquipmentData.filter(
      (row) =>
        String(row.displayEquipId) ===
        String(selectedEquipment.displayEquipId)
    );
  }, [filteredCriticalEquipmentData, selectedEquipment]);

  const [stats, setStats] = useState({
    totalNotifications: '0',
    notif15Days: '0',
    m2Pending: '0',
    m1Pending: '0',
    overdue: '0',
    impactedUnits: '0',
  });
  const prevRawSignature = useRef('');
  useEffect(() => {

    const signature = filteredRawData.length + '|' + (filteredRawData[0] ? Object.keys(filteredRawData[0]).join(',') : '');
    if (prevRawSignature.current !== signature) {
      const newStats = calculateKpiStats(filteredRawData);
      setStats((prev) => {
        const p = JSON.stringify(prev);
        const n = JSON.stringify(newStats);
        return p === n ? prev : newStats;
      });
      prevRawSignature.current = signature;
    }
  }, [filteredRawData]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('data-loaded', { detail: rawData }));
  }, [rawData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedEquipment(null);
        setShowUploadDialog(false);
        setIsFilterPopoverOpen(false);
        setSelectedNotification(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);



  const handleSendEmail = async (notification) => {
    if (!notification) return;
    
    try {
      const response = await fetch("http://localhost:8000/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageFilter: Number(ageFilter) || 1,
          notifications: [
            {
              id: notification.id,
              workCtr: notification.workCtr,
              type: notification.type,
              status: notification.status,
              sysStatus: notification.sysStatus,
              description: notification.description,
              notifDate: notification.notifDate
            }
          ]
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message || "Email successfully processed by backend.");
      } else {
        alert("Error sending email: " + data.message);
      }
    } catch (error) {
      console.error("Failed to send email API request:", error);
      alert("Failed to send email API request.");
    }
  };

  const processUploadedFile = async () => {
    if (!selectedFile) return;

    setShowUploadDialog(false);
    setUploadLoading(true);
    setProcessingPercent(0);

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

      setProcessingPercent(30);
      await yieldToMain();

      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

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
      const sysStatusKey = findKey(sample, ['System status', 'Systemstatus', 'System Status']);
      const desc1Key = Object.keys(sample).find((k) => k.toLowerCase() === "description");
      const desc2Key = Object.keys(sample).find((k) => k.toLowerCase() === "description2" || k.toLowerCase() === "description 2");

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
            sysStatus: String(row[sysStatusKey] || '').toUpperCase().trim() || 'N/A',
            description: String(row[desc1Key] || '').trim() + (row[desc2Key] ? ' ' + String(row[desc2Key] || '').trim() : ''),
            type: row[typeKey] || 'N/A',
            workCtr: row[workCtrKey] || 'N/A',
            requiredEnd: parseDate(row[requiredEndKey]),
            notifDate: parseDate(row[notifDateKey]),
            priority: row[priorityKey] || 'Normal',
            color: ['rose', 'indigo', 'emerald', 'amber'][idx % 4],
          };
        });

      setProcessingPercent(100);
      await yieldToMain();

      setNotifications(updatedNotifications);
      setRawData(jsonData);
      localStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications)
      );

      localStorage.setItem(
        "rawData",
        JSON.stringify(jsonData)
      );
      setSelectedFile(null);

      setTimeout(() => {
        setUploadLoading(false);
        setProcessingPercent(0);
      }, 400);

    } catch (err) {
      console.error(err);
      await yieldToMain();
      setTimeout(() => {
        setUploadLoading(false);
        setProcessingPercent(0);
      }, 3000);
    }
  };

  const handleSendGroupEmail = async () => {
    const sample = rawData[0] || {};
    const idKey = findKey(sample, ["Notification", "Notification No", "Notifictn"]);

    const validIds = new Set(filteredRawData.map(row => String(row[idKey]).trim()));

    const emailFilteredNotifications = notifications.filter(n => {
      const rawUnit = String(n.workCtr ?? '').trim().toUpperCase();
      const isMRMS = rawUnit.startsWith('MR') || rawUnit.startsWith('MS');
      return isMRMS && validIds.has(n.id);
    });

    if (emailFilteredNotifications.length === 0) {
      alert("There are 0 matching notifications. Please upload an Excel file first or adjust filters.");
      return;
    }

    try {
      const payload = {
        ageFilter: Number(ageFilter) || 1,
        notifications: emailFilteredNotifications.map(n => ({
          id: n.id,
          workCtr: n.workCtr,
          type: n.type,
          status: n.status,
          sysStatus: n.sysStatus,
          description: n.description,
          notifDate: n.notifDate
        }))
      };

      const response = await fetch("http://localhost:8000/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message || "Group emails successfully processed by backend.");
      } else {
        alert("Error sending group emails: " + data.message);
      }
    } catch (error) {
      console.error("Failed to send group email API request:", error);
      alert("Failed to send group email API request.");
    }
  };
  return (
    <Layout
      hasData={rawData.length > 0}
      dateRange={dateRange}
      setDateRange={setDateRange}
      ageFilter={ageFilter}
      setAgeFilter={setAgeFilter}
      onUploadClick={() => setShowUploadDialog(true)}
      onSendEmailClick={handleSendGroupEmail}
    >
      <div className="px-4 py-1">
        <ProcessingOverlay uploadLoading={uploadLoading} processingPercent={processingPercent} />
        {rawData.length > 0 ? (
          <>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex flex-wrap items-center gap-2 justify-end">
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-2 mb-3">
              <div className="bg-white rounded-[12px] border border-slate-200 p-2 shadow-sm flex flex-col gap-1.5">
                <label className="text-[12px] font-black capitalize tracking-wider text-slate-500 truncate">Unit Filter</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveUnitFilter([])}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${activeUnitFilter.length === 0 ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    All
                  </button>
                  {availableUnits.map((unit) => {
                    const isSelected = activeUnitFilter.includes(unit);
                    return (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => {
                          if (activeUnitFilter.length === 0 || activeUnitFilter.length === availableUnits.length) {
                            setActiveUnitFilter([unit]);
                          } else if (activeUnitFilter.includes(unit)) {
                            setActiveUnitFilter(activeUnitFilter.filter((u) => u !== unit));
                          } else {
                            setActiveUnitFilter([...activeUnitFilter, unit]);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${isSelected ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        {unit}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-[12px] border border-slate-200 p-2 shadow-sm flex flex-col gap-1.5">
                <label className="text-[12px] font-black capitalize tracking-wider text-slate-500 truncate">Department Filter</label>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveDeptFilter([])}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${(activeDeptFilter.length === 0 || activeDeptFilter.length === DEPARTMENTS.length) ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      All
                    </button>
                    {DEPARTMENTS.slice(0, 4).map((dept) => {
                      const isSelected = activeDeptFilter.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            if (activeDeptFilter.length === 0 || activeDeptFilter.length === DEPARTMENTS.length) {
                              setActiveDeptFilter([dept]);
                            } else if (activeDeptFilter.includes(dept)) {
                              setActiveDeptFilter(activeDeptFilter.filter((d) => d !== dept));
                            } else {
                              setActiveDeptFilter([...activeDeptFilter, dept]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${isSelected ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {{ MR: "Rotary (MR)", MS: "Static (MS)", MI: "Instrumentation (MI)", ME: "Electrical (ME)", FS: "Fire & Safety (FS)", MC: "Civil (MC)", OTHERS: "Others" }[dept] || dept}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DEPARTMENTS.slice(4).map((dept) => {
                      const isSelected = activeDeptFilter.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            if (activeDeptFilter.length === 0 || activeDeptFilter.length === DEPARTMENTS.length) {
                              setActiveDeptFilter([dept]);
                            } else if (activeDeptFilter.includes(dept)) {
                              setActiveDeptFilter(activeDeptFilter.filter((d) => d !== dept));
                            } else {
                              setActiveDeptFilter([...activeDeptFilter, dept]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${isSelected ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {{ MR: "Rotary (MR)", MS: "Static (MS)", MI: "Instrumentation (MI)", ME: "Electrical (ME)", FS: "Fire & Safety (FS)", MC: "Civil (MC)", OTHERS: "Others" }[dept] || dept}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[12px] border border-slate-200 p-2 shadow-sm flex flex-col gap-1.5">
                <label className="text-[12px] font-black capitalize tracking-wider text-slate-500 truncate">Notification Filter</label>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTypeFilter([])}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${activeTypeFilter.length === 0 ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      All
                    </button>
                    {ALL_TYPES.slice(0, 4).map((type) => {
                      const isSelected = activeTypeFilter.some((item) => item.value === type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            if (activeTypeFilter.length === 0 || activeTypeFilter.length === ALL_TYPES.length) {
                              setActiveTypeFilter([{ value: type, label: type }]);
                            } else if (activeTypeFilter.some((item) => item.value === type)) {
                              setActiveTypeFilter(activeTypeFilter.filter((item) => item.value !== type));
                            } else {
                              setActiveTypeFilter([...activeTypeFilter, { value: type, label: type }]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${isSelected ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TYPES.slice(4).map((type) => {
                      const isSelected = activeTypeFilter.some((item) => item.value === type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            if (activeTypeFilter.length === 0 || activeTypeFilter.length === ALL_TYPES.length) {
                              setActiveTypeFilter([{ value: type, label: type }]);
                            } else if (activeTypeFilter.some((item) => item.value === type)) {
                              setActiveTypeFilter(activeTypeFilter.filter((item) => item.value !== type));
                            } else {
                              setActiveTypeFilter([...activeTypeFilter, { value: type, label: type }]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${isSelected ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[12px] border border-slate-200 p-1 shadow-sm flex flex-col gap-1.5">
                <label className="text-[12px] font-black capitalize tracking-wider text-slate-500 truncate">User Status Filter</label>
                <div className="flex flex-col gap-1.5">
                  {USER_STATUS_ROWS.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex flex-wrap gap-1.5">
                      {rowIndex === 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveUserStatusFilter([])}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${activeUserStatusFilter.length === 0 ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          All
                        </button>
                      )}
                      {row.map((status) => {
                        const isSelected = activeUserStatusFilter.includes(status);
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              if (activeUserStatusFilter.length === 0 || activeUserStatusFilter.length === USER_STATUSES.length) {
                                setActiveUserStatusFilter([status]);
                              } else if (activeUserStatusFilter.includes(status)) {
                                setActiveUserStatusFilter(activeUserStatusFilter.filter((s) => s !== status));
                              } else {
                                setActiveUserStatusFilter([...activeUserStatusFilter, status]);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${isSelected ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[12px] border border-slate-200 p-2 shadow-sm flex flex-col gap-1.5">
                <label className="text-[12px] font-black capitalize tracking-wider text-slate-500 truncate">System Status Filter</label>
                <div className="flex flex-col gap-1.5">
                  {SYS_STATUS_ROWS.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex flex-wrap gap-1.5">
                      {rowIndex === 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveSystemStatusFilter([])}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${activeSystemStatusFilter.length === 0 ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          All
                        </button>
                      )}
                      {row.map((status) => {
                        const isSelected = activeSystemStatusFilter.includes(status);
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              if (activeSystemStatusFilter.length === 0 || activeSystemStatusFilter.length === SYS_STATUSES.length) {
                                setActiveSystemStatusFilter([status]);
                              } else if (activeSystemStatusFilter.includes(status)) {
                                setActiveSystemStatusFilter(activeSystemStatusFilter.filter((s) => s !== status));
                              } else {
                                setActiveSystemStatusFilter([...activeSystemStatusFilter, status]);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border-transparent ${isSelected ? 'bg-[#003865] text-white shadow-sm hover:bg-[#003865]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <KpiSection stats={stats} />

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-1 min-w-0">
                <MrMsPieChart title="Total Notifications Unit Type Wise" data={filteredRawData} />
              </div>
              <div className="lg:col-span-1 min-w-0">
                <NotificationTypeBarChart
                  title="Notification Type Wise"
                  data={filteredRawData}
                />
              </div>
              <div className="lg:col-span-1 min-w-0">
                <TopEquipmentBarChart
                  data={filteredCriticalEquipmentData}
                  onEquipmentClick={(item) => {
                    setSelectedEquipment(prev =>
                      prev?.displayEquipId === item.displayEquipId
                        ? null
                        : item
                    );

                    document
                      .getElementById("critical-equipment-table-section")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                  onViewAllClick={() => {
                    document.getElementById('critical-equipment-table-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
              </div>
            </div>
            {/* <UnitWiseBarChart
    title="Static Notification Unit Wise"
    prefix="MS"
    data={filteredRawData}
  />

  <UnitWiseBarChart
    title="Rotary Notification Unit Wise"
    prefix="MR"
    data={filteredRawData}
  />

  <UnitWiseBarChart
    title="Instrumentation Notification Unit Wise"
    prefix="MI"
    data={filteredRawData}
  />

  <UnitWiseBarChart
    title="Electrical Notification Unit Wise"
    prefix="ME"
    data={filteredRawData}
  />

  <UnitWiseBarChart
    title="Fire Safety Notification Unit Wise"
    prefix="FS"
    data={filteredRawData}
  />

  <UnitWiseBarChart
    title="Civils Notification Unit Wise"
    prefix="MC"
    data={filteredRawData}
  /> */}
            {/* <UnitWiseBarChart
                title="Notification Unit Wise"
                data={filteredRawData}
                selectedDepartments={activeDeptFilter}
              /> */}
            <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="min-w-0">
                <UnitWiseBarChart
                  title="Notification Unit Wise"
                  data={filteredRawData}
                  selectedDepartments={activeDeptFilter}
                />
              </div>

              <div className="min-w-0">
                <TotalDueNotificationsChart data={dueChartData} />
              </div>
            </div>



            <div id="critical-equipment-table-section" className="mt-4 flex gap-4 items-stretch overflow-hidden">
              <div className={`transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${selectedEquipment ? 'w-[calc(100%-520px)]' : 'w-full'} flex-1 min-w-0`}>
                <CriticalEquipmentTable
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filteredCriticalEquipmentData={displayedCriticalEquipmentData}
                  selectedEquipment={selectedEquipment}
                  setSelectedEquipment={setSelectedEquipment}
                />
              </div>

              <div className={`relative shrink-0 transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${selectedEquipment ? 'w-[500px]' : 'w-0'}`}>
                <EquipmentDetailsDrawer
                  selectedEquipment={selectedEquipment}
                  setSelectedEquipment={setSelectedEquipment}
                />
              </div>
            </div>
          </>
        ) : (
          <EmptyDashboardState setShowUploadDialog={setShowUploadDialog} />
        )}
        <NotificationDetailsModal
          selectedNotification={selectedNotification}
          setSelectedNotification={setSelectedNotification}
          handleSendEmail={handleSendEmail}
        />


        <UploadDataDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          uploadLoading={uploadLoading}
          processUploadedFile={processUploadedFile}
        />
      </div>

    </Layout>
  )
};
export default Dashboard;
