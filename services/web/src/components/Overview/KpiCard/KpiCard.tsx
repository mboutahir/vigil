import { KPI_CONFIG, type KpiState } from './KpiCardData';
import KpiCardIcon from './KpiCardIcon';

interface Data {
  state: KpiState;
  value: number;
  total?: number;
  caption: string;
  active: boolean;
  onClick: () => void;
}

export default function KpiCard({
  state,
  value,
  total,
  caption,
  active,
  onClick,
}: Data) {
  const config = KPI_CONFIG[state];
  const digits = String(value).length;
  const size =
    digits <= 2 ? 'text-[64px] sm:text-[72px]' : digits === 3 ? 'text-[56px]' : 'text-[44px]';

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`${active ? 'border-vigil-accent-border-selected' : 'border-vigil-border'} rounded-(--vigil-radius-panel) kpi-card cursor-pointer group text-left flex flex-col justify-between gap-4 p-5 bg-vigil-card col-span-12 md:col-span-6 xl:col-span-3 border min-h-40 sm:min-h-44 overflow-hidden`}
    >
      <h6 className="title uppercase flex items-center text-vigil-muted text-sm tracking-wider">
        <KpiCardIcon cardIcon={state} />
        {config.label}
      </h6>
      <div className="flex w-full flex-wrap items-end justify-between gap-x-2 gap-y-1">
        <div>
          <h6 className="text-base font-medium">
            {config.slogan}
          </h6>
          <h6 className="text-[13px] sm:text-sm text-vigil-muted text-start mt-0.5 tracking-wider">
            {caption}
          </h6>
        </div>
        <div className={`num space ${size} ms-auto tabular-nums`}>
          {value}
          {total !== undefined && (
            <span className="text-[0.5em] text-vigil-muted">/{total}</span>
          )}
        </div>
      </div>
    </button>
  );
}
