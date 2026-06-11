import React, { useState } from 'react';
import { BsStars, BsCalendarDate, BsUpload, BsEnvelope } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { User, LogOut } from "lucide-react";

const Header = ({
  hasData = false,
  activeView,
  setActiveView,
  dateRange,
  setDateRange,
  ageFilter,
  setAgeFilter,
  onUploadClick,
  onSendEmailClick,
}) => {
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col shadow-sm bg-theme-primary">
      {/* Yellow Top Banner with Scrolling Text */}
      <div className="h-8 flex items-center overflow-hidden whitespace-nowrap text-sm bg-theme-secondary text-theme-on-secondary font-bold">
        <div className="w-full flex items-center overflow-hidden">
          <div className="animate-theme-marquee">
            Welcome to BPCL SAP Dashboard • Select Filters and Upload Data to Begin Analysis...
          </div>
        </div>
      </div>

      {/* Main Blue Header Area */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-8 h-[60px]">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <h1 className="text-xl sm:text-2xl font-black leading-none tracking-tight text-theme-on-primary">
              SAP Notification Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            {hasData && setDateRange && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white rounded-[1rem] border border-slate-200 shadow-sm px-4 h-[38px] transition-colors hover:border-[#ffc000] group">
                  <div className="w-[180px]">
                    <DatePicker
                      selectsRange
                      startDate={dateRange?.[0]}
                      endDate={dateRange?.[1]}
                      onChange={(update) => setDateRange(update)}
                      maxDate={new Date()}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select date range"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      className="w-full text-sm font-semibold text-slate-800 outline-none bg-transparent placeholder-slate-400 cursor-pointer"
                    />
                  </div>
                  <BsCalendarDate className="text-slate-400 flex-shrink-0 w-[16px] h-[16px] group-hover:text-[#ffc000] transition-colors" />
                </div>

                <div className="flex items-center gap-1.5 bg-white rounded-[1rem] border border-slate-200 shadow-sm px-4 h-[38px] transition-colors hover:border-[#ffc000]">
                  <input
                    type="number"
                    min="0"
                    placeholder="All"
                    value={ageFilter ?? ''}
                    onChange={(e) => setAgeFilter(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-[36px] text-sm font-semibold text-slate-800 outline-none bg-transparent placeholder-slate-400 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-semibold text-slate-500">days</span>
                </div>
              </div>
            )}

            {hasData && (
              <div className="flex items-center gap-3">
                <button
                  onClick={onUploadClick}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-theme-secondary bg-transparent px-4 h-[38px] text-sm font-semibold text-theme-secondary shadow-sm transition hover:bg-theme-secondary/10 focus:outline-none focus:ring-2 focus:ring-theme-secondary cursor-pointer"
                >
                  <BsUpload className="text-theme-secondary text-sm" />
                  Upload New File
                </button>

                <button
                  onClick={onSendEmailClick}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-theme-secondary px-4 h-[38px] text-sm font-bold text-theme-primary shadow-md transition duration-200 hover:brightness-110 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-theme-secondary cursor-pointer"
                >
                  <BsEnvelope className="h-4 w-4" />
                  Send Emails
                </button>
              </div>
            )}

            <div className="hidden sm:block h-6 w-px bg-white/20" />
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="inline-flex items-center justify-center rounded-full border border-transparent bg-white/10 w-10 h-10 text-white transition hover:bg-white/20 cursor-pointer"
              >
                <User className="h-5 w-5" />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {setActiveView && (
          <div className="px-8 flex items-center gap-6 mt-[-4px]">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`text-sm font-semibold h-10 flex items-center border-b-[3px] transition-all ${activeView === "dashboard"
                ? "text-white border-white"
                : "text-white/60 border-transparent hover:text-white"
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView("critical")}
              className={`text-sm font-semibold h-10 flex items-center border-b-[3px] transition-all ${activeView === "critical"
                ? "text-white border-white"
                : "text-white/60 border-transparent hover:text-white"
                }`}
            >
              Critical Equipment
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;