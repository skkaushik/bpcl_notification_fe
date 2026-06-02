import React, { useRef } from 'react';

const UploadDataDialog = ({
  isOpen,
  onClose,
  selectedFile,
  setSelectedFile,
  uploadLoading,
  processUploadedFile
}) => {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  return (
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
            onClick={() => fileInputRef.current?.click()}
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
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDataDialog;
