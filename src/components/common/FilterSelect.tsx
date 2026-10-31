import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';

interface FilterSelectProps {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  description,
  value,
  options,
  onChange,
}) => {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(option => option.value === value);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>('input:checked')?.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <div className="min-w-0">
      <span id={`${id}-label`} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <button
        type="button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${id}-dialog`}
        onClick={() => setIsOpen(true)}
        className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 text-left text-base sm:text-sm text-slate-900 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 cursor-pointer"
      >
        <span id={`${id}-value`} className="truncate">{selected?.label ?? value}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
      </button>
      {createPortal(
        <dialog
          ref={dialogRef}
          id={`${id}-dialog`}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-description`}
          onClose={() => setIsOpen(false)}
          onClick={event => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom) {
              setIsOpen(false);
            }
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-sm max-h-[85dvh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-xs"
        >
          <div className="flex max-h-[85dvh] flex-col text-left">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 id={`${id}-title`} className="font-sans text-base font-semibold">{label}</h2>
                <p id={`${id}-description`} className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
              </div>
              <button
                type="button"
                aria-label={`Close ${label.toLowerCase()}`}
                onClick={() => setIsOpen(false)}
                className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500 cursor-pointer"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div role="radiogroup" aria-labelledby={`${id}-title`} className="min-h-0 space-y-1 overflow-y-auto p-3">
              {options.map(option => (
                <label
                  key={option.value}
                  className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-slate-500 ${
                    option.value === value
                      ? 'border-slate-300 bg-slate-100 font-semibold text-slate-900'
                      : 'border-transparent text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{option.label}</span>
                  <input
                    type="radio"
                    name={`${id}-option`}
                    value={option.value}
                    checked={option.value === value}
                    onChange={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className="h-4 w-4 shrink-0 accent-slate-900"
                  />
                </label>
              ))}
            </div>
            <div className="shrink-0 border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-11 w-full rounded-lg bg-slate-50 px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </dialog>,
        document.body,
      )}
    </div>
  );
};
