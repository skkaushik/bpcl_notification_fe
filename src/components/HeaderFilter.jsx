import { useState, useRef, useEffect } from "react";

const HeaderFilter = ({
  title,
  options,
  value,
  onChange
}) => {

  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {

    const handler = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () =>
      document.removeEventListener(
        "mousedown",
        handler
      );

  }, []);

  const allSelected =
    value.length === options.length;

  const toggleAll = () => {

    if (allSelected) {
      onChange([]);
    } else {
      onChange(options);
    }

  };

  const toggleItem = (item) => {

    const exists =
      value.some(
        v => v.value === item.value
      );

    if (exists) {

      onChange(
        value.filter(
          v => v.value !== item.value
        )
      );

    } else {

      onChange([
        ...value,
        item
      ]);

    }

  };

  return (
    <div
      className="relative"
      ref={ref}
    >
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="flex items-center gap-2 font-semibold"
      >
        {title}

        {value.length > 0 && (
          <span>
            ({value.length})
          </span>
        )}

        ▼
      </button>

      {open && (

        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border bg-white p-3 shadow-xl">

          <label className="mb-2 flex gap-2">

            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
            />

            Select All

          </label>

          <div className="max-h-60 overflow-y-auto">

            {options.map(item => (

              <label
                key={item.value}
                className="flex gap-2 py-1"
              >
                <input
                  type="checkbox"
                  checked={
                    value.some(
                      v =>
                        v.value === item.value
                    )
                  }
                  onChange={() =>
                    toggleItem(item)
                  }
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderFilter;