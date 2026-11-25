import AlertsPreviewRow from './AlertsPreviewRow';
import type { AlertHistory, AlertStatus } from '../../../api/alertHistoryApi';
import type { AlertFilter } from '../overviewData';

const FILTERS: AlertFilter[] = ['open', 'critical', 'warning'];

const chip =
  'border uppercase text-xs tracking-wider h-6.5 sm:h-7.5 min-w-15 px-2 cursor-pointer transition-colors duration-300';
const chipIdle =
  'border-vigil-border text-vigil-muted hover:text-vigil-text-hover hover:border-vigil-border-hover';
const chipActive = 'border-vigil-accent text-vigil-accent';

interface Data {
  alerts: AlertHistory[];
  filter: AlertFilter;
  onFilterChange: (filter: AlertFilter) => void;
  isLoading: boolean;
  error: Error | null;
  currentUserId?: string;
  updatingId?: string;
  onStatusChange: (id: string, status: AlertStatus) => void;
}

export default function AlertsPreview({
  alerts,
  filter,
  onFilterChange,
  isLoading,
  error,
  currentUserId,
  updatingId,
  onStatusChange,
}: Data) {
  return (
    <div className="rounded-(--vigil-radius-panel) flex flex-col h-full min-h-0 border border-vigil-border bg-vigil-card overflow-hidden flex-1">
      <div className="overview-card-header sticky top-0 z-39 bg-vigil-card">
        <h2 className="text-[15px] sm:text-[17px] font-medium tracking-wide">
          Alerts
          <span className="mono ms-2 text-xs text-vigil-muted-extra">
            {alerts.length}
          </span>
        </h2>
        <div className="space-x-2 print:hidden">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => onFilterChange(f)}
              className={`${chip} ${filter === f ? chipActive : chipIdle}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto scrollbar-vigil min-h-0 flex-1">
        {isLoading && <Empty>Loading alerts...</Empty>}
        {error && <Empty className="text-vigil-state-danger-text">{error.message}</Empty>}
        {!isLoading && !error && alerts.length === 0 && (
          <div className="flex h-full flex-col">
            <Empty>Nothing matches this filter and range.</Empty>
            <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-5">
              <img src="/vigil-owl.svg" alt="" className="h-full max-h-36 w-full object-contain grayscale opacity-25" />
            </div>
          </div>
        )}
        {alerts.map((alert) => (
          <AlertsPreviewRow
            key={alert.id}
            alert={alert}
            canAct={alert.owner_id === null || alert.owner_id === currentUserId}
            isUpdating={updatingId === alert.id}
            onStatusChange={(status) => onStatusChange(alert.id, status)}
          />
        ))}
      </div>
    </div>
  );
}

export function Empty({
  children,
  className = 'text-vigil-muted',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`mono px-4 py-7 text-center text-[12px] ${className}`}>
      {children}
    </p>
  );
}
