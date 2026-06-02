import React from 'react';
import DataTable from 'react-data-table-component';

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
      cursor: 'pointer',
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

const CriticalEquipmentTable = ({
  searchQuery,
  setSearchQuery,
  filteredCriticalEquipmentData,
  selectedEquipment,
  setSelectedEquipment
}) => {
  return (
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
          customStyles={customStyles}
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
  );
};

export default CriticalEquipmentTable;
