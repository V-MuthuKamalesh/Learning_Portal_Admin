import { ElementType } from "react";

type MetricProps = {
  label: string;
  value: string;
  icon?: ElementType;
  color?: string;
};

export function Metric({ label, value, icon: Icon, color = "var(--accent)" }: MetricProps) {
  return (
    <div className="metric">
      {Icon && (
        <div className="metricIcon" style={{ background: color + "18", color }}>
          <Icon size={18} />
        </div>
      )}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
