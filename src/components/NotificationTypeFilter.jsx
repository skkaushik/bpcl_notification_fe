import React from 'react';

export const ALL_TYPES = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'];

const NotificationTypeFilter = ({ value = [], onChange, wrapperClassName = "" }) => {
  return (
    <div className={`flex flex-wrap gap-2 items-center ${wrapperClassName}`}>
      <button
        onClick={() => onChange([])}
        className={`cursor-pointer px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md
          ${(value.length === 0 || value.length === ALL_TYPES.length)
            ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm"
            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
          }`}
      >
        All
      </button>
      {ALL_TYPES.map((type) => {
        const isSelected = value.some((item) => item.value === type);
        return (
          <button
            key={type}
            onClick={() => {
              if (value.length === 0 || value.length === ALL_TYPES.length) {
                onChange([{ value: type, label: type }]);
              } else if (value.some((item) => item.value === type)) {
                onChange(value.filter((item) => item.value !== type));
              } else {
                onChange([...value, { value: type, label: type }]);
              }
            }}
            className={`cursor-pointer px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md
              ${isSelected
                ? "bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
              }`}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
};

export default NotificationTypeFilter;
