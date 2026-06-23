import { useRef, useState, useEffect } from "react";
// import { uploadFileApi } from "../services/uploadService";

const UploadDataDialog = ({
  isOpen,
  onClose,
  selectedFile,
  setSelectedFile,
  uploadLoading,
   processUploadedFile,
}) => {
  const fileInputRef = useRef(null);
const [isUploading, setIsUploading] = useState(false);
useEffect(() => {
  if (!isOpen) {
    // setIsUploading(false);
  }
}, [isOpen]);
  if (!isOpen) return null;
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };
//   const handleUploadToBackend = async () => {
//   try {
//     if (!selectedFile) {
//       alert("Please select a file");
//       return;
//     }

//     const response = await uploadFileApi(selectedFile);

//     console.log("UPLOAD RESPONSE:", response);

//     if (response.success) {
//       const sessionId = response.data.session_id;

//       localStorage.setItem(
//         "session_id",
//         sessionId
//       );
//       await processUploadedFile();
// onClose();
//     }
//   }catch (error) {
//   console.error("UPLOAD ERROR:", error);

//   if (error.response) {
//     console.log("Status:", error.response.status);
//     console.log("Response:", error.response.data);
//   } else {
//     console.log("Message:", error.message);
//   }

//   alert("File upload failed");
// }
// };
const handleUploadToBackend = async () => {
  if (isUploading) return;

  try {
    setIsUploading(true);

    if (!selectedFile) {
      alert("Please select a file");
      setIsUploading(false);
      return;
    }

    // const response = await uploadFileApi(selectedFile);

    // console.log("UPLOAD RESPONSE:", response);

    // if (response.success) {
    //   const sessionId = response.data.session_id;

    //   localStorage.setItem(
    //     "session_id",
    //     sessionId
    //   );

      await processUploadedFile();
     setIsUploading(false);
      onClose();
    // }
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Response:", error.response.data);
    }

    alert("File upload failed");

    setIsUploading(false);
  }
};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Upload Data File
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Upload Excel file for dashboard analytics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50 p-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-[#003865] hover:bg-[#003865]/10 transition-all"
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
          {/* <button
  disabled={uploadLoading}
  onClick={() => {
    if (!selectedFile) {
      fileInputRef.current?.click();
    } else {
      handleUploadToBackend();
    }
  }}
  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all"
>
  {uploadLoading
    ? "Processing File..."
    : selectedFile
    ? "Process File"
    : "Select File"}
</button> */}
          <button
  disabled={uploadLoading || isUploading}
  onClick={() => {
    if (!selectedFile) {
      fileInputRef.current?.click();
    } else {
      handleUploadToBackend();
    }
  }}
  className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all
    ${
      uploadLoading || isUploading
        ? "bg-[#003865]/50 cursor-not-allowed"
        : "bg-[#003865] hover:bg-[#002244]"
    }`}
>
  {isUploading ? (
    <div className="flex items-center justify-center gap-2">
      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      processing...
    </div>
  ) : uploadLoading ? (
    "Processing File..."
  ) : selectedFile ? (
    "Process File"
  ) : (
    "Select File"
  )}
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
