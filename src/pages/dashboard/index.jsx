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
import { useState, useRef, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsUpload, BsEnvelope, BsFilter } from "react-icons/bs";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDateFilter, endDateFilter] = dateRange;
  const [ageFilter, setAgeFilter] = useState(0);

  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [draftActiveUnitFilter, setDraftActiveUnitFilter] = useState([]);
  const [draftActiveTypeFilter, setDraftActiveTypeFilter] = useState([]);
  const [draftActiveDeptFilter, setDraftActiveDeptFilter] = useState([]);
  const [draftDateRange, setDraftDateRange] = useState([null, null]);
  const [draftAgeFilter, setDraftAgeFilter] = useState(0);
  const filterButtonRef = useRef(null);
  const filterPopoverRef = useRef(null);
  const popoverDatePickerRef = useRef(null);

  const availableUnits = useMemo(() => {
    if (!rawData.length) return [];
    const sample = rawData[0];
    const workCtrKey = findKey(sample, ["Main WorkCtr", "MainWorkCtr", "Unit"]);
    if (!workCtrKey) return [];

    const units = new Set();
    rawData.forEach(row => {
      const rawUnit = String(row[workCtrKey] || "").trim().toUpperCase();
      if (rawUnit.startsWith("MR") || rawUnit.startsWith("MS")) {
        units.add(rawUnit.substring(2).trim());
      }
    });
    return Array.from(units).sort();
  }, [rawData]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    const allUnitsSelected = availableUnits.length > 0 && activeUnitFilter.length === availableUnits.length;
    const allTypesSelected = activeTypeFilter.length === ALL_TYPES.length;
    const allDeptsSelected = activeDeptFilter.length === 2;

    if (activeUnitFilter.length && !allUnitsSelected) count += 1;
    if (activeTypeFilter.length && !allTypesSelected) count += 1;
    if (activeDeptFilter.length && !allDeptsSelected) count += 1;
    if (dateRange[0] || dateRange[1]) count += 1;
    if (ageFilter > 0) count += 1;
    return count;
  }, [activeUnitFilter, activeTypeFilter, activeDeptFilter, dateRange, ageFilter, availableUnits.length]);

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
          if (rawUnit.startsWith("MR") || rawUnit.startsWith("MS")) {
            plantName = rawUnit.substring(2).trim();
          }
          return activeUnitFilter.includes(plantName);
        });
      }
    }

    if (activeDeptFilter.length > 0 && activeDeptFilter.length < 2) {
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

    if (startDateFilter || endDateFilter || Number(ageFilter) > 0) {
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
            if (startDateFilter) {
              const start = new Date(startDateFilter);
              start.setHours(0, 0, 0, 0);
              passDate = passDate && notifDate >= start;
            }
            if (endDateFilter) {
              const end = new Date(endDateFilter);
              end.setHours(23, 59, 59, 999);
              passDate = passDate && notifDate <= end;
            }
            if (Number(ageFilter) > 0) {
              const thresholdDate = new Date();
              thresholdDate.setDate(thresholdDate.getDate() - Number(ageFilter));
              thresholdDate.setHours(0, 0, 0, 0);
              passAge = passAge && notifDate >= thresholdDate;
            }
          } else {
            passDate = false;
            passAge = false;
          }

          if (!startDateFilter && !endDateFilter) passDate = true;
          if (!ageFilter || Number(ageFilter) <= 0) passAge = true;

          return passDate && passAge;
        });
      }
    }

    return result;
  }, [rawData, activeTypeFilter, typeKeyInData, activeUnitFilter, activeDeptFilter, startDateFilter, endDateFilter, ageFilter]);



  const dueChartData = useMemo(() => {
    return buildDueChartData(filteredRawData);
  }, [filteredRawData]);
  const criticalEquipmentData = useMemo(() => {
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


  const [stats, setStats] = useState({
    totalNotifications: '0',
    notif15Days: '0',
    m2Pending: '0',
    m1Pending: '0',
    overdue: '0',
    impactedUnits: '0',
  });
  const [selectedEquipment, setSelectedEquipment] = useState(null);
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

  useEffect(() => {
    if (!isFilterPopoverOpen) return;
    const handleClickOutside = (event) => {
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(event.target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target)
      ) {
        setIsFilterPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterPopoverOpen]);

  const handleSendEmail = async (notification) => {
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
      const subject = encodeURIComponent(
        `Notification Alert: ${notification.id} - ${notification.equip}`
      );

      const body = encodeURIComponent(
        `Hello,\n\nPlease review the following notification details:\n\nNotification ID: ${notification.id}\nEquipment: ${notification.equip}\nType: ${notification.type}\nStatus: ${notification.status}\nWork Center: ${notification.workCtr}\nRequired End: ${notification.requiredEnd}\n\nThank you.`
      );

      window.open(
        `mailto:${targetEmail}?subject=${subject}&body=${body}`,
        '_blank'
      );
    } else {
      alert(
        `No email configuration found for plant: ${plantName} with prefix ${prefix}`
      );
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

  const handleSendGroupEmail = () => {
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

    const emailGroups = {};
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
        const isProcessStatus = status === 'PENDING' || status.includes('APRE') || status.includes('JBCO') || status.includes('JBPR');
        const targetEmail = isProcessType && isProcessStatus
          ? plantConfig.processEmail
          : prefix === 'MR'
          ? plantConfig.rotaryMail
          : prefix === 'MS'
          ? plantConfig.staticMail
          : plantConfig.processEmail || plantConfig.rotaryMail || plantConfig.staticMail;

        if (targetEmail) {
          if (!emailGroups[targetEmail]) emailGroups[targetEmail] = [];
          emailGroups[targetEmail].push(notif);
        }
      }
    });

    const targetEmails = Object.keys(emailGroups);
    if (targetEmails.length === 0) {
      alert("No matching emails found for current data.");
      return;
    }

    const selectedAge = Number(ageFilter) > 0 ? Number(ageFilter) : 1;
    const ageLabel = selectedAge === 1 ? 'day' : 'days';

    const emailsToOpen = [];
    
    Object.entries(emailGroups).forEach(([email, notifs]) => {
      let rawUnit = String(notifs[0]?.workCtr ?? '').trim().toUpperCase();
      let plantName = rawUnit;
      if (rawUnit.startsWith('MR') || rawUnit.startsWith('MS')) {
        plantName = rawUnit.substring(2).trim();
      }
      
      const subject = `Pending Notifications - ${plantName} (Last ${selectedAge} ${ageLabel})`;

      let bodyStr = `Dear Sir,\n\n`;
      bodyStr += `Please find Below the notifications pending for the last ${selectedAge} ${ageLabel}:\n\n`;
      bodyStr += `Plant name\tNotification no\tNotification Date\tNotification Type\tDescription\tDays Pending\tUser status\tSystem status\n`;

      notifs.forEach((n) => {
        let daysPending = '0';
        if (n.notifDate && n.notifDate !== 'N/A') {
          const notifD = new Date(n.notifDate);
          if (!isNaN(notifD)) {
            const diffTime = Math.abs(new Date() - notifD);
            daysPending = Math.ceil(diffTime / (1000 * 60 * 60 * 24)).toString();
          }
        }
        
        let desc = (n.description || '').replace(/\r?\n|\r/g, " ").substring(0, 60);
        let dateStr = n.notifDate !== 'N/A' ? n.notifDate : '';
        
        bodyStr += `${n.workCtr}\t${n.id}\t${dateStr}\t${n.type}\t${desc}\t${daysPending}\t${n.status}\t${n.sysStatus}\n`;
      });

      bodyStr += `\nKindly take necessary action.\n\n`;
      bodyStr += `Regards,\nMechanical Maintenance Team`;

      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(bodyStr);
      
      const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
      
      emailsToOpen.push({
        url: mailtoUrl,
        recipient: email
      });
    });

    let delayTime = 0;
    emailsToOpen.forEach((emailObj) => {
      setTimeout(() => {
        try {
          window.open(emailObj.url, '_blank');
        } catch (error) {
          console.error(`Error opening mailto for ${emailObj.recipient}:`, error);
        }
      }, delayTime);
      delayTime += 800;
    });
  };

  return (
    <Layout hasData={rawData.length > 0}>

      <div className="px-4 py-4">
        <ProcessingOverlay uploadLoading={uploadLoading} processingPercent={processingPercent} />
        {rawData.length > 0 ? (
          <>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 transition-colors duration-200 hover:text-[#4F46E5]">Dashboard</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-end">
                <button
                  onClick={() => setShowUploadDialog(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-700 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <BsUpload className="text-purple-600 text-base" />
                  Upload New File
                </button>

                <div className="relative shrink-0">
                  <button
                    ref={filterButtonRef}
                    type="button"
                    onClick={() => {
                      setDraftActiveUnitFilter([...activeUnitFilter]);
                      setDraftActiveTypeFilter([...activeTypeFilter]);
                      setDraftActiveDeptFilter([...activeDeptFilter]);
                      setDraftDateRange([...dateRange]);
                      setDraftAgeFilter(ageFilter);
                      setIsFilterPopoverOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:border-black hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <BsFilter className="h-4 w-4 text-slate-800" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-semibold text-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {isFilterPopoverOpen && (
                    <div
                      ref={filterPopoverRef}
                      className="absolute right-0 top-full z-30 mt-3 w-[760px] max-w-[calc(100vw-32px)] rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                          <h3 className="mt-2 text-lg font-bold text-slate-900">Filter Settings</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDraftActiveUnitFilter([]);
                            setDraftActiveTypeFilter([]);
                            setDraftActiveDeptFilter([]);
                            setDraftDateRange([null, null]);
                            setDraftAgeFilter(0);
                            setActiveUnitFilter([]);
                            setActiveTypeFilter([]);
                            setActiveDeptFilter([]);
                            setDateRange([null, null]);
                            setAgeFilter(0);
                            setIsFilterPopoverOpen(false);
                          }}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Reset Defaults
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <p className="text-sm font-semibold text-slate-900">Unit Filter</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setDraftActiveUnitFilter([])}
                              className={`px-3 py-2 rounded-2xl text-sm font-semibold border-2 transition ${draftActiveUnitFilter.length === 0 ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                            >
                              All
                            </button>
                            {availableUnits.map((unit) => {
                              const isSelected = draftActiveUnitFilter.includes(unit);
                              return (
                                <button
                                  key={unit}
                                  type="button"
                                  onClick={() => {
                                    if (draftActiveUnitFilter.length === 0 || draftActiveUnitFilter.length === availableUnits.length) {
                                      setDraftActiveUnitFilter([unit]);
                                    } else if (draftActiveUnitFilter.includes(unit)) {
                                      setDraftActiveUnitFilter(draftActiveUnitFilter.filter((u) => u !== unit));
                                    } else {
                                      setDraftActiveUnitFilter([...draftActiveUnitFilter, unit]);
                                    }
                                  }}
                                  className={`px-3 py-2 rounded-2xl text-sm font-semibold border-2 transition ${isSelected ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                                >
                                  {unit}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <p className="text-sm font-semibold text-slate-900">Notification Type</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setDraftActiveTypeFilter([])}
                              className={`px-3 py-2 rounded-2xl text-sm font-semibold border-2 transition ${draftActiveTypeFilter.length === 0 ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                            >
                              All
                            </button>
                            {ALL_TYPES.map((type) => {
                              const isSelected = draftActiveTypeFilter.some((item) => item.value === type);
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    if (draftActiveTypeFilter.length === 0 || draftActiveTypeFilter.length === ALL_TYPES.length) {
                                      setDraftActiveTypeFilter([{ value: type, label: type }]);
                                    } else if (draftActiveTypeFilter.some((item) => item.value === type)) {
                                      setDraftActiveTypeFilter(draftActiveTypeFilter.filter((item) => item.value !== type));
                                    } else {
                                      setDraftActiveTypeFilter([...draftActiveTypeFilter, { value: type, label: type }]);
                                    }
                                  }}
                                  className={`px-3 py-2 rounded-2xl text-sm font-semibold border-2 transition ${isSelected ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                                >
                                  {type}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <p className="text-sm font-semibold text-slate-900">Department Type</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setDraftActiveDeptFilter([])}
                              className={`px-3 py-2 rounded-2xl text-sm font-semibold border-2 transition ${(draftActiveDeptFilter.length === 0 || draftActiveDeptFilter.length === 2) ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                            >
                              All
                            </button>
                            {['MR', 'MS'].map((dept) => {
                              const isSelected = draftActiveDeptFilter.includes(dept);
                              return (
                                <button
                                  key={dept}
                                  type="button"
                                  onClick={() => {
                                    if (draftActiveDeptFilter.length === 0 || draftActiveDeptFilter.length === 2) {
                                      setDraftActiveDeptFilter([dept]);
                                    } else if (draftActiveDeptFilter.includes(dept)) {
                                      setDraftActiveDeptFilter(draftActiveDeptFilter.filter((d) => d !== dept));
                                    } else {
                                      setDraftActiveDeptFilter([...draftActiveDeptFilter, dept]);
                                    }
                                  }}
                                  className={`px-3 py-2 rounded-2xl text-sm font-semibold border-2 transition ${isSelected ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                                >
                                  {dept === 'MR' ? 'Rotary (MR)' : 'Static (MS)'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900 mb-2">Date Range</p>
                          <div className="relative">
                            <DatePicker
                              ref={popoverDatePickerRef}
                              selectsRange
                              startDate={draftDateRange[0]}
                              endDate={draftDateRange[1]}
                              onChange={(update) => setDraftDateRange(update)}
                              maxDate={new Date()}
                              dateFormat="dd-MM-yyyy"
                              placeholderText="dd-mm-yyyy - dd-mm-yyyy"
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="select"
                              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                              isClearable
                              wrapperClassName="w-full"
                            />
                            <button
                              type="button"
                              onClick={() => popoverDatePickerRef.current?.setOpen(true)}
                              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-indigo-600"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900 mb-2">Age (Last X days)</p>
                          <input
                            type="number"
                            min="0"
                            value={draftAgeFilter}
                            onChange={(e) => setDraftAgeFilter(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full rounded-2xl border border-slate-200 bg-white py-2 px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsFilterPopoverOpen(false)}
                          className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveUnitFilter(draftActiveUnitFilter);
                            setActiveTypeFilter(draftActiveTypeFilter);
                            setActiveDeptFilter(draftActiveDeptFilter);
                            setDateRange(draftDateRange);
                            setAgeFilter(draftAgeFilter);
                            setIsFilterPopoverOpen(false);
                          }}
                          className="rounded-2xl bg-[#4F46E5] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#3730a3]"
                        >
                          Apply Filter
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSendGroupEmail}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4F46E5] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:bg-[#3730a3] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <BsEnvelope className="h-4 w-4" />
                  Send Emails
                </button>
              </div>
            </div>

            <KpiSection stats={stats} />

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-1 min-w-0">
                <MrMsPieChart title="Total Notifications Unit Type Wise" data={rawData} />
              </div>
              <div className="lg:col-span-2 min-w-0">
                <NotificationTypeBarChart title="Notification Type Wise" data={filteredRawData} />
              </div>
            </div>

            <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
              <UnitWiseBarChart title="Static Notification Unit Wise" prefix="MS" data={filteredRawData} />
              <UnitWiseBarChart title="Rotary Notification Unit Wise" prefix="MR" data={filteredRawData} />
            </div>

            <TotalDueNotificationsChart data={dueChartData} />

            <div className="mt-4 flex gap-4 items-stretch overflow-hidden">
              <div className={`transition-all duration-300 ease-in-out ${selectedEquipment ? 'w-[40%]' : 'w-full'}`}>
                <CriticalEquipmentTable
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filteredCriticalEquipmentData={filteredCriticalEquipmentData}
                  selectedEquipment={selectedEquipment}
                  setSelectedEquipment={setSelectedEquipment}
                />
              </div>

              <div className={`relative shrink-0 transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${selectedEquipment ? 'w-[60%]' : 'w-0'}`}>
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
  );
};
export default Dashboard;
