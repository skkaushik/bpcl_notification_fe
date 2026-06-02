import Layout from "../../components/Layout";
import NotificationTypeBarChart from "../../components/NotificationTypeBarChart";
import UnitWiseBarChart from "../../components/UnitWiseBarChart";
import SendEmailModal from "../../components/SendEmailModal";
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
import { BsUpload, BsEnvelope } from "react-icons/bs";
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
  const [showGlobalEmailModal, setShowGlobalEmailModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [processingPercent, setProcessingPercent] = useState(0);
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

  const handleSendEmail = async(notification) => {
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

    window.location.href =
      `mailto:${targetEmail}?subject=${subject}&body=${body}`;
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
      await yieldToMain();

      setNotifications(updatedNotifications);
      setRawData(jsonData);
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
  return (
    <Layout hasData={rawData.length > 0}>

      <div className="px-8 py-6">
        <ProcessingOverlay uploadLoading={uploadLoading} processingPercent={processingPercent} />
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

            <KpiSection stats={stats} />

            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
              <NotificationTypeBarChart data={filteredRawData} />
              <MrMsPieChart data={filteredRawData} />
            </div>

            <div className="mt-8 grid gap-8 grid-cols-1 lg:grid-cols-2">
              <UnitWiseBarChart title="Static Notification Unit Wise" prefix="MS" data={filteredRawData} />
              <UnitWiseBarChart title="Rotary Notification Unit Wise" prefix="MR" data={filteredRawData} />
            </div>

            <TotalDueNotificationsChart data={dueChartData} />

            <div className="mt-8 flex gap-6 items-start overflow-hidden">
              <CriticalEquipmentTable
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredCriticalEquipmentData={filteredCriticalEquipmentData}
                selectedEquipment={selectedEquipment}
                setSelectedEquipment={setSelectedEquipment}
              />

              <EquipmentDetailsDrawer
                selectedEquipment={selectedEquipment}
                setSelectedEquipment={setSelectedEquipment}
              />
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

      <SendEmailModal
        isOpen={showGlobalEmailModal}
        onClose={() => setShowGlobalEmailModal(false)}
        notifications={notifications}
      />

    </Layout>
  );
};
export default Dashboard;
