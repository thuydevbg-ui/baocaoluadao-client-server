'use client';

const StatusBadge = ({
  label,
  color,
  background,
}: {
  label: string;
  color: string;
  background?: string;
}) => (
  <span
    className="rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.1em]"
    style={{ color, borderColor: color, backgroundColor: background }}
  >
    {label}
  </span>
);

export default StatusBadge;
