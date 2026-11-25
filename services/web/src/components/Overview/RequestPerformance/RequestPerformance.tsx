import { useState } from 'react';
import type { Series } from './MetricsChart';
import MetricsChart from './MetricsChart';

type ChartType = 'line' | 'bar';
const TYPES: ChartType[] = ['line', 'bar'];

// same chip look as the alerts and logs filters
const chip =
  'border uppercase text-xs tracking-wider h-6.5 sm:h-7.5 min-w-15 px-2 cursor-pointer transition-colors duration-300';
const chipIdle =
  'border-vigil-border text-vigil-muted hover:text-[#ffffffc2] hover:border-[#ffffff80]';
const chipActive = 'border-vigil-blue text-vigil-blue';

export type Point = {
  ts: number;
  throughput: number;
  // null when the bucket has no spans, so the line shows a gap instead of 0ms
  latency: number | null;
  errors: number;
};

const SERIES: Series<Point>[] = [
  {
    key: 'throughput',
    name: 'Throughput',
    color: 'var(--vigil-success)',
    kind: 'area',
    unit: 'spans/min',
  },
  {
    key: 'errors',
    name: 'Errors',
    color: 'var(--vigil-chart-error)',
    kind: 'bar',
    unit: 'errors/min',
  },
  {
    key: 'latency',
    name: 'Latency',
    color: 'var(--vigil-warning)',
    axis: 'right',
    unit: 'ms',
  },
];

interface Data {
  data: Point[];
  // ranges over 36h show the date instead of the time
  long: boolean;
  note?: string;
}

const formatX = (long: boolean) => (v: unknown) => {
  const date = new Date(v as number);
  return long
    ? `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}h`
    : date.toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
};

export default function RequestPerformance({ data, long, note }: Data) {
  const [type, setType] = useState<ChartType>('line');
  // bar mode is the same chart with every series drawn as bars
  const series =
    type === 'bar' ? SERIES.map((s) => ({ ...s, kind: 'bar' as const })) : SERIES;

  return (
    <div className="rounded-(--vigil-radius-panel) flex flex-col h-full min-h-0 border border-vigil-border bg-vigil-card">
      <div className="overview-card-header mb-4">
        <h2 className="text-[15px] sm:text-[17px] font-medium tracking-wide">
          Request performance
          {note && (
            <span className="mono ms-2 text-xs text-vigil-muted-extra">
              {note}
            </span>
          )}
        </h2>
        <div className="space-x-2 print:hidden">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={`${chip} ${type === t ? chipActive : chipIdle}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-vigil-muted items-center">
          {SERIES.map((s) => (
            <span key={s.key}>
              <span
                className="me-1.5 inline-block h-2 w-2"
                style={{ background: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 px-1 sm:px-3 py-3">
        <MetricsChart
          data={data}
          xKey="ts"
          series={series}
          xFormatter={formatX(long)}
        />
      </div>
    </div>
  );
}
