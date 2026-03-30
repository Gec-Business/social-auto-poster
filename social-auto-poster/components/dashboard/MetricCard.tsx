interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'accent' | 'green' | 'orange' | 'red';
}

export default function MetricCard({ label, value, sub, color = 'accent' }: MetricCardProps) {
  return (
    <div className="mcc-metric">
      <div className="mcc-metric-label">{label}</div>
      <div className={`mcc-metric-value ${color}`}>{value}</div>
      {sub && <div className="mcc-metric-sub">{sub}</div>}
    </div>
  );
}
