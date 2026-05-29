export type ApiDebugEntry = {
  id: string;
  createdAt: string;
  method: string;
  path: string;
  status: number | "NETWORK_ERROR";
  ok: boolean;
  durationMs: number;
  requestBody?: unknown;
  responseBody?: unknown;
};

type Listener = (entries: ApiDebugEntry[]) => void;

const MAX_ENTRIES = 60;
const listeners = new Set<Listener>();
let entries: ApiDebugEntry[] = [];

export const apiDebugEnabled =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_API_DEBUG === "true";

export function logApiEntry(entry: Omit<ApiDebugEntry, "id" | "createdAt">) {
  if (!apiDebugEnabled) {
    return;
  }

  entries = [
    {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toLocaleTimeString()
    },
    ...entries
  ].slice(0, MAX_ENTRIES);

  listeners.forEach((listener) => listener(entries));
}

export function subscribeApiDebug(listener: Listener) {
  listeners.add(listener);
  listener(entries);
  return () => {
    listeners.delete(listener);
  };
}

export function clearApiDebugEntries() {
  entries = [];
  listeners.forEach((listener) => listener(entries));
}
