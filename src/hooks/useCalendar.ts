import { useCallback, useEffect, useRef, useState } from 'react';
import { getTodayDateString } from '../lib/formatters';

// Recheck after midnight and when a suspended browser/PWA becomes active.
export function useToday(): string {
  const [today, setToday] = useState(getTodayDateString);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timer);
      setToday(getTodayDateString());
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(check, Math.min(midnight.getTime() - now.getTime() + 50, 60_000));
    };
    check();
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', check);
      window.removeEventListener('pageshow', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return today;
}

// A new form follows today until the user chooses a date. Saved dates never follow it.
export function useDefaultDate(isOpen: boolean, editing = false) {
  const today = useToday();
  const [value, setValue] = useState(getTodayDateString);
  const manual = useRef(false);
  const setDate = useCallback((date: string) => {
    manual.current = true;
    setValue(date);
  }, []);
  const resetDate = useCallback(() => {
    manual.current = false;
    setValue(getTodayDateString());
  }, []);
  useEffect(() => {
    if (isOpen && !editing) resetDate();
  }, [isOpen, editing, resetDate]);
  useEffect(() => {
    if (isOpen && !editing && !manual.current) setValue(getTodayDateString());
  }, [today, isOpen, editing]);
  return [value, setDate, resetDate] as const;
}

export function useReferenceMonth(): [string, (month: string) => void] {
  const today = useToday();
  const month = today.slice(0, 7);
  const previousMonth = useRef(month);
  const [selected, setSelected] = useState(month);
  useEffect(() => {
    // Keep deliberate historical-month navigation; advance the current month automatically.
    const oldMonth = previousMonth.current;
    setSelected(value => value === oldMonth ? month : value);
    previousMonth.current = month;
  }, [month]);
  return [selected, setSelected];
}
