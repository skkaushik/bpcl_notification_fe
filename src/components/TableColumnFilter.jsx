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

  let bgClass = "bg-transparent text-slate-700";
  if (isFocused) bgClass = "bg-[#f8fafc] text-slate-900";
  if (isActive) bgClass = "bg-[#f1f5f9] text-slate-900";

  const props = {
    ...innerProps,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
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
      <div className={`flex items-center w-full px-3 py-2 cursor-pointer transition-colors ${bgClass}`}>
        <input 
          type="checkbox" 
          checked={isSelected} 
          readOnly 
          className="mr-3 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-medium">{children}</span>
      </div>
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
        classNamePrefix="react-select"
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      />
    </div>
  );
};

export default TableColumnFilter;
