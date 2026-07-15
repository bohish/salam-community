// Compare drawer — stores up to 4 player IDs in localStorage.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const KEY = "futhub:compare";
const MAX = 4;

const read = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useCompare() {
  const [ids, setIds] = useState<string[]>(read);

  useEffect(() => {
    const l = () => setIds(read());
    listeners.add(l);
    window.addEventListener("storage", l);
    return () => { listeners.delete(l); window.removeEventListener("storage", l); };
  }, []);

  const persist = (next: string[]) => {
    localStorage.setItem(KEY, JSON.stringify(next));
    emit();
  };

  const has = useCallback((id: number | string) => ids.includes(String(id)), [ids]);

  const toggle = useCallback((id: number | string) => {
    const key = String(id);
    const current = read();
    if (current.includes(key)) {
      persist(current.filter((x) => x !== key));
      toast.success("أُزيل من المقارنة");
    } else {
      if (current.length >= MAX) {
        toast.error(`الحد الأقصى للمقارنة ${MAX} لاعبين`);
        return;
      }
      persist([...current, key]);
      toast.success("أُضيف إلى المقارنة");
    }
  }, []);

  const clear = useCallback(() => { persist([]); toast.success("تم تفريغ المقارنة"); }, []);
  const remove = useCallback((id: number | string) => persist(read().filter((x) => x !== String(id))), []);

  return { ids, count: ids.length, has, toggle, clear, remove, max: MAX };
}
