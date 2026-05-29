import React, { useState } from 'react';
import Select, { components } from 'react-select';

export const ALL_TYPES = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'];
export const SELECT_ALL_OPTION = { value: "__ALL__", label: "Select All" };

const InputOption = ({
  getStyles,
  Icon,
  isDisabled,
  isFocused,
  isSelected,
  children,
  innerProps,
  ...rest
}) => {
  const [isActive, setIsActive] = useState(false);
  const onMouseDown = () => setIsActive(true);
  const onMouseUp = () => setIsActive(false);
  const onMouseLeave = () => setIsActive(false);

  let bg = "transparent";
  if (isFocused) bg = "#f8fafc";
  if (isActive) bg = "#f1f5f9";

  const style = {
    alignItems: "center",
    backgroundColor: bg,
    color: "inherit",
    display: "flex",
    padding: "8px 12px",
    cursor: "pointer",
  };

  const props = {
    ...innerProps,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    style,
  };

  return (
    <components.Option
      {...rest}
      isDisabled={isDisabled}
      isFocused={isFocused}
      isSelected={isSelected}
      getStyles={getStyles}
      innerProps={props}
    >
      <input 
        type="checkbox" 
        checked={isSelected} 
        readOnly 
        className="mr-3 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-sm font-medium text-slate-700">{children}</span>
    </components.Option>
  );
};

const CustomMultiValue = (props) => {
  if (props.data.value === "__ALL__") {
    return null;
  }
  return <components.MultiValue {...props} />;
};

const TableColumnFilter = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Filter...",
  className = "text-sm",
  wrapperClassName = ""
}) => {

  const allOptions = options;

  const handleChange = (selected, actionMeta) => {

    if (!selected || selected.length === 0) {
      onChange([]);
      return;
    }

    if (actionMeta.option?.value === "__ALL__") {

      const currentlyAllSelected =
        value.length === options.length;

      if (currentlyAllSelected) {
        onChange([]);
      } else {
        onChange(options);
      }

      return;
    }

    const filtered =
      selected.filter(
        option =>
          option.value !== "__ALL__"
      );

    onChange(filtered);

  };

  const selectedValue = (() => {
    const allSelected = value.length === ALL_TYPES.length;
    if (allSelected) {
      return [SELECT_ALL_OPTION, ...value];
    }
    return value;
  })();

  return (
    <div className={wrapperClassName}>
      <Select
        isMulti
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        components={{ Option: InputOption, MultiValue: CustomMultiValue }}
        options={[SELECT_ALL_OPTION, ...allOptions]}
        value={selectedValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        styles={{
          menuPortal: base => ({ ...base, zIndex: 9999 }),
          control: (base) => ({
            ...base,
            minHeight: "42px",
            maxHeight: "60px",
            overflowY: "auto",
            borderRadius: "12px",
            borderColor: "#e2e8f0",
            boxShadow: "none",
            alignItems: "flex-start",
            paddingTop: "4px",
            paddingBottom: "4px",
            "&:hover": { borderColor: "#cbd5e1" },
            "::-webkit-scrollbar": { width: "6px" },
            "::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "10px" }
          }),
          multiValue: (base) => ({
            ...base,
            borderRadius: "8px",
            backgroundColor: "#eef2ff",
            padding: "2px 4px",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: "#4f46e5",
            fontWeight: 700,
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: "#4f46e5",
            ":hover": {
              backgroundColor: "#e0e7ff",
              color: "#4338ca",
              borderRadius: "6px",
            },
          }),
          menu: (base) => ({
            ...base,
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            border: "1px solid #e2e8f0",
          }),
          menuList: (base) => ({
            ...base,
            padding: "4px",
            "::-webkit-scrollbar": { width: "8px" },
            "::-webkit-scrollbar-track": { background: "transparent" },
            "::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "10px" },
            "::-webkit-scrollbar-thumb:hover": { background: "#94a3b8" },
          }),
          valueContainer: (base) => ({
            ...base,
            maxHeight: "80px",
            overflowY: "auto",
            flexWrap: "wrap",
            "::-webkit-scrollbar": { width: "6px" },
            "::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "10px" }
          }),
        }}
      />
    </div>
  );
};

export default TableColumnFilter;
