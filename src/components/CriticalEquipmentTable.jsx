import DataTable from 'react-data-table-component';

const CriticalEquipmentTable = ({
  searchQuery,
  setSearchQuery,
  filteredCriticalEquipmentData,
  selectedEquipment,
  setSelectedEquipment
}) => {
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

  return (
    <div className="flex-1 min-w-0 w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-[24px] shadow-sm overflow-hidden transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
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
      <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden [&_.rdt_TableHeadRow]:!bg-indigo-50 [&_.rdt_TableHeadRow]:!border-b [&_.rdt_TableHeadRow]:!border-indigo-100 [&_.rdt_TableHeadRow]:!min-h-[56px] [&_.rdt_TableHeadRow]:!rounded-t-2xl [&_.rdt_TableCol]:!text-[13px] [&_.rdt_TableCol]:!font-bold [&_.rdt_TableCol]:!text-indigo-800 [&_.rdt_TableCol]:!uppercase [&_.rdt_TableCol]:!tracking-[0.05em] [&_.rdt_TableRow]:!min-h-[64px] [&_.rdt_TableRow]:!text-sm [&_.rdt_TableRow]:!text-slate-700 [&_.rdt_TableRow]:!bg-white [&_.rdt_TableRow]:!cursor-pointer hover:[&_.rdt_TableRow]:!bg-slate-50 [&_.rdt_TableRow:nth-child(odd)]:!bg-slate-50 [&_.rdt_Pagination]:!border-t [&_.rdt_Pagination]:!border-slate-200 [&_.rdt_Pagination]:!rounded-b-2xl">
        <DataTable
          columns={criticalEquipmentColumns}
          data={filteredCriticalEquipmentData}
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
