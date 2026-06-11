import React from "react";
import "../index.css";

const DataTable = ({
  columns = [],
  data = [],
  emptyMessage = "No data available",
  maxHeightClass = "max-h-[500px]",
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

      <div className={`overflow-auto ${maxHeightClass}`}>
        <table className="w-full">

          <thead className="sticky top-0 z-10 bg-[#003865]">

            <tr>

              {columns.map((column) => (
                <th
                  key={column.key}
                  className="relative border-b border-[#003865] px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}

            </tr>

          </thead>

          <tbody>

            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-slate-50"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-slate-700"
                    >
                      {column.render
                        ? column.render(row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

          </tbody>

        </table>
      </div>

    </div>
  );
};

export default DataTable;