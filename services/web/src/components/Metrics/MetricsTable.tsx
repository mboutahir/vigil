import InfiniteScrollRow from '../shared/InfiniteScrollRow';
import type { Metric } from '../../api/metricsApi';
import MetricsRow from './MetricsRow';
import { metricKey } from './metricData';

interface Data {
  metrics: Metric[];
  units: Record<string, string>;
  selectedKey: string | null;
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onSelect: (metric: Metric) => void;
}

const COLUMNS = ['Time', 'Service', 'Name', 'Value'];

export default function MetricsTable({
  metrics,
  units,
  selectedKey,
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onSelect,
}: Data) {
  return (
    // lets the table scroll horizontally on small screens
    //table scroll sideways on mobile and make table tke full box
    //thead headof the table 
    //tr rows one line border loop over column it has all the headers and show them add paddings it draws the headers the 4 headers not the metrics
    <div className="rounded-(--vigil-radius-panel) overflow-x-auto border border-vigil-border">
      <table className="w-full min-w-180 border-collapse">
        <thead>
          <tr className="border-b border-vigil-border uppercase text-left text-vigil-muted text-[12px] md:text-[13px] bg-vigil-panel tracking-wide">
            {COLUMNS.map((column, index) => (
              <th key={index} className="py-2 md:py-4 px-2 md:px-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-vigil-card">
          {/* if its loading collapse the 4 collumns into one and write loading */}
          {isLoading && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-vigil-muted">
                Loading…
              </td>
            </tr>
          )}
          {/* same as isloading but for error */}
          {error && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-vigil-state-danger-text">
                {error.message}
                {hasNextPage && (
                  <button type="button" onClick={onLoadMore} className="ml-3 underline">
                    Retry
                  </button>
                )}
              </td>
            </tr>
          )}
          {/* if not loading and no errror and no metrics  */}
          {!isLoading && !error && metrics.length === 0 && (
            <tr>
              <td colSpan={4} className="py-15 text-center">
                <h1 className="mb-1 text-[20px]">No metrics found</h1>
                <p className="text-[14px] tracking-wider text-vigil-muted">
                  Try a wider period or clear the service filter.
                </p>
              </td>
            </tr>
          )}
          {/* we draw the actual metrics  MetricsRow component that take these props key is tell react to compare it between renders in stead of comparing the position of the rows because they dont change*/}
          {metrics.map((metric) => {
            const key = metricKey(metric);
            return (
              <MetricsRow
                key={key}
                metric={metric}
                unit={units[metric.name] ?? ''}
                //the row is open when its key is the one we saved in the page
                isSelected={key === selectedKey}
                onSelect={() => onSelect(metric)}
              />
            );
          })}
          {!isLoading && !error && metrics.length > 0 && (
            <InfiniteScrollRow
              colSpan={COLUMNS.length}
              hasMore={hasNextPage}
              loading={isFetchingNextPage}
              onLoadMore={onLoadMore}
            />
          )}
        </tbody>
      </table>
    </div>
  );
}
