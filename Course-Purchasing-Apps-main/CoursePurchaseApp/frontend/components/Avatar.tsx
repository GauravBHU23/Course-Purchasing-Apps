type Props = {
  name: string;
  color?: string;
  url?: string | null;
  size?: number;
  className?: string;
};

function initialsFrom(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, color = "#0e7c70", url, size = 36, className = "" }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };

  if (url) {
    return (
      <img
        alt={name}
        className={`avatar avatar-img ${className}`}
        src={url}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span className={`avatar ${className}`} style={{ ...style, background: color }}>
      {initialsFrom(name) || "?"}
    </span>
  );
}
