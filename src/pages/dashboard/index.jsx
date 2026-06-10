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
import { BsUpload, BsEnvelope, BsArrowCounterclockwise, BsCalendarDate } from "react-icons/bs";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDateFilter, endDateFilter] = dateRange;
  const [ageFilter, setAgeFilter] = useState(0);



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
              const thresholdDate = new Date();
              thresholdDate.setDate(thresholdDate.getDate() - Number(ageFilter));
              thresholdDate.setHours(0, 0, 0, 0);
              passAge = notifDate >= thresholdDate;
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
  }, [rawData, activeTypeFilter, typeKeyInData, activeUnitFilter, activeDeptFilter, startDateFilter, endDateFilter, ageFilter]);



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
                <h1 className="text-lg font-bold text-slate-700 transition-colors duration-200">Apply filters for Unit, Department, and Type</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-end">
                <div className="flex items-center gap-2 bg-white rounded-[1rem] border border-slate-200 shadow-sm px-4 h-[46px] transition-colors hover:border-indigo-300 group">
                  <div className="w-[215px]">
                    <DatePicker
                      selectsRange
                      startDate={dateRange[0]}
                      endDate={dateRange[1]}
                      onChange={(update) => setDateRange(update)}
                      maxDate={new Date()}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select date range"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      className="w-full text-sm font-semibold text-slate-800 outline-none bg-transparent placeholder-slate-400 cursor-pointer pr-8"
                    // isClearable
                    />
                  </div>
                  <BsCalendarDate className="text-slate-400 flex-shrink-0 w-[18px] h-[18px] group-hover:text-indigo-500 transition-colors" />
                </div>

                <div className="flex items-center gap-1.5 bg-white rounded-[1rem] border border-slate-200 shadow-sm px-4 h-[46px] transition-colors hover:border-indigo-300">
                  <input
                    type="number"
                    min="0"
                    placeholder="All"
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-[36px] text-sm font-semibold text-slate-800 outline-none bg-transparent placeholder-slate-400 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-semibold text-slate-500">days</span>
                </div>

                <button
                  onClick={() => setShowUploadDialog(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-purple-200 bg-white px-5 h-[46px] text-sm font-semibold text-purple-700 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-200 cursor-pointer"
                >
                  <BsUpload className="text-purple-600 text-base" />
                  Upload New File
                </button>



                <button
                  onClick={handleSendGroupEmail}
                  className="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[#4F46E5] px-5 h-[46px] text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:bg-[#3730a3] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                >
                  <BsEnvelope className="h-4 w-4" />
                  Send Emails
                </button>
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-[24px] border border-slate-200 p-4 shadow-sm mb-4 flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x lg:divide-slate-200 gap-y-6">
                <div className="flex flex-col gap-2 lg:pr-6">
                  <label className="text-[13px] font-bold text-slate-600 px-1 capitalize">Unit</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveUnitFilter([])}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${activeUnitFilter.length === 0 ? 'bg-indigo-200 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-slate-100 text-slate-500 border-transparent hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'}`}
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
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${isSelected ? 'bg-indigo-200 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-slate-100 text-slate-500 border-transparent hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'}`}
                        >
                          {unit}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:px-6">
                  <label className="text-[13px] font-bold text-slate-600 px-1 capitalize">Department</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveDeptFilter([])}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${(activeDeptFilter.length === 0 || activeDeptFilter.length === DEPARTMENTS.length) ? 'bg-indigo-200 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-slate-100 text-slate-500 border-transparent hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'}`}
                    >
                      All
                    </button>
                    {DEPARTMENTS.map((dept) => {
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
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${isSelected ? 'bg-indigo-200 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-slate-100 text-slate-500 border-transparent hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'}`}
                        >
                          {{ MR: "Rotary (MR)", MS: "Static (MS)", MI: "Instrumentation (MI)", ME: "Electrical (ME)", FS: "Fire & Safety (FS)", MC: "Civil (MC)", OTHERS: "Others" }[dept] || dept}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:pl-6">
                  <label className="text-[13px] font-bold text-slate-600 px-1 capitalize">Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTypeFilter([])}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${activeTypeFilter.length === 0 ? 'bg-indigo-200 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-slate-100 text-slate-500 border-transparent hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'}`}
                    >
                      All
                    </button>
                    {ALL_TYPES.map((type) => {
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
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${isSelected ? 'bg-indigo-200 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-slate-100 text-slate-500 border-transparent hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'}`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* <div className="flex justify-end border-t border-slate-100 pt-4 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveUnitFilter([]);
                    setActiveTypeFilter([]);
                    setActiveDeptFilter([]);
                    setDateRange([null, null]);
                    setAgeFilter(0);
                  }}
                  className="flex items-center justify-center gap-1.5 h-[40px] px-6 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-sm"
                >
                  <BsArrowCounterclockwise className="h-4 w-4" />
                  Reset Defaults
                </button>
              </div> */}
            </div>

            <KpiSection stats={stats} />

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-1 min-w-0">
                <MrMsPieChart title="Total Notifications Unit Type Wise" data={filteredRawData} />
              </div>
              <div className="lg:col-span-2 min-w-0">
                <NotificationTypeBarChart title="Notification Type Wise" data={filteredRawData} />
              </div>
            </div>

            <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
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
              <UnitWiseBarChart
                title="Notification Unit Wise"
                data={filteredRawData}
                selectedDepartments={activeDeptFilter}
              />

              <TotalDueNotificationsChart data={dueChartData} />
            </div>

            <div className="mt-4 flex gap-4 items-stretch overflow-hidden">
              <div className={`transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${selectedEquipment ? 'w-[calc(100%-520px)]' : 'w-full'} flex-1 min-w-0`}>
                <CriticalEquipmentTable
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filteredCriticalEquipmentData={filteredCriticalEquipmentData}
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
  );
};
export default Dashboard;
