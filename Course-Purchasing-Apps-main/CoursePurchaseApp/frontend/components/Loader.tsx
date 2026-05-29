import { BookOpen } from "lucide-react";

export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader-ring">
        <BookOpen size={22} />
      </span>
      <span className="loader-label">{label}</span>
    </div>
  );
}
