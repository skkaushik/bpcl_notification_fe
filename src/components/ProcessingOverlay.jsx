import React from 'react';

const ProcessingOverlay = ({ uploadLoading, processingPercent }) => {
  if (!uploadLoading) return null;

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

  return (
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
  );
};

export default ProcessingOverlay;
