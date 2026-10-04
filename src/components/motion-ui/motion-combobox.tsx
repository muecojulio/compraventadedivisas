import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { BOUNCY_SPRING, cx } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";

export type MotionComboboxOption = {
  value: string;
  label: string;
  description?: string;
  leading?: ReactNode;
};

export type MotionComboboxProps = {
  label: ReactNode;
  value: string | null;
  options: readonly MotionComboboxOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");
}

/** Selector accesible con búsqueda, flechas, Enter, Escape y lista animada. */
export function MotionCombobox({
  label,
  value,
  options,
  onValueChange,
  placeholder = "Escribe para buscar…",
  emptyMessage = "No hay coincidencias.",
  className,
  disabled = false,
}: MotionComboboxProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const skipFocusOpen = useRef(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = useMotionOff();
  const spring = useSpringTransition(BOUNCY_SPRING);

  const selected = options.find((option) => option.value === value) ?? null;
  const filteredOptions = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return options;
    return options.filter((option) =>
      normalize(`${option.label} ${option.value} ${option.description ?? ""}`).includes(needle),
    );
  }, [options, query]);
  const activeOption = filteredOptions[activeIndex];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !activeOption) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, activeOption, open]);

  function showOptions() {
    if (!open) {
      setQuery("");
      const selectedIndex = options.findIndex((option) => option.value === value);
      setActiveIndex(Math.max(0, selectedIndex));
    }
    setOpen(true);
  }

  function choose(option: MotionComboboxOption) {
    onValueChange(option.value);
    setOpen(false);
    setQuery("");
    if (document.activeElement !== inputRef.current) {
      skipFocusOpen.current = true;
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        showOptions();
        setActiveIndex(
          Math.max(
            0,
            options.findIndex((option) => option.value === value),
          ),
        );
      } else if (filteredOptions.length > 0) {
        setActiveIndex((index) => (index + 1) % filteredOptions.length);
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        showOptions();
        setActiveIndex(
          Math.max(
            0,
            options.findIndex((option) => option.value === value),
          ),
        );
      } else if (filteredOptions.length > 0) {
        setActiveIndex((index) => (index - 1 + filteredOptions.length) % filteredOptions.length);
      }
      return;
    }
    if (event.key === "Home" && open && filteredOptions.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End" && open && filteredOptions.length > 0) {
      event.preventDefault();
      setActiveIndex(filteredOptions.length - 1);
      return;
    }
    if (event.key === "Enter" && open && activeOption) {
      event.preventDefault();
      choose(activeOption);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div
      ref={rootRef}
      className={cx("mui-combobox", open && "is-open", disabled && "is-disabled", className)}
    >
      <label className="mui-field__label" htmlFor={inputId}>
        {label}
      </label>
      <span className={cx("mui-combobox__box", open && "is-open")}>
        <Search className="mui-combobox__search-icon" size={17} aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          className="mui-combobox__input"
          value={open ? query : (selected?.label ?? "")}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeOption ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-haspopup="listbox"
          onFocus={() => {
            if (skipFocusOpen.current) {
              skipFocusOpen.current = false;
              return;
            }
            showOptions();
          }}
          onClick={showOptions}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="mui-combobox__trigger"
          tabIndex={-1}
          aria-label={open ? "Cerrar opciones" : "Mostrar opciones"}
          aria-expanded={open}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) {
              setOpen(false);
              setQuery("");
            } else {
              showOptions();
              inputRef.current?.focus();
            }
          }}
        >
          <motion.span
            animate={{ rotate: open && !reduced ? 180 : 0 }}
            transition={spring}
            aria-hidden="true"
          >
            <ChevronsUpDown size={17} />
          </motion.span>
        </button>
      </span>

      <div
        id={listboxId}
        className="mui-combobox__popover-anchor"
        role="listbox"
        aria-label={typeof label === "string" ? label : "Opciones"}
        aria-hidden={!open}
        data-open={open}
      >
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="options"
              className="mui-combobox__popover"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -5, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={spring}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <motion.button
                      key={option.value}
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      id={`${listboxId}-option-${index}`}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-selected={isSelected}
                      className={cx(
                        "mui-combobox__option",
                        isActive && "is-active",
                        isSelected && "is-selected",
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(option)}
                    >
                      {option.leading ? (
                        <span className="mui-combobox__option-icon" aria-hidden="true">
                          {option.leading}
                        </span>
                      ) : null}
                      <span className="mui-combobox__option-copy">
                        <span className="mui-combobox__option-label">{option.label}</span>
                        {option.description ? (
                          <span className="mui-combobox__option-description">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check className="mui-combobox__check" size={17} aria-hidden="true" />
                      ) : null}
                    </motion.button>
                  );
                })
              ) : (
                <p
                  className="mui-combobox__empty"
                  role="option"
                  aria-selected="false"
                  aria-disabled="true"
                >
                  {emptyMessage}
                </p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
