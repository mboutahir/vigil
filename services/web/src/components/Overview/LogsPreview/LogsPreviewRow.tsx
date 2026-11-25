import type { Log } from '../../../api/logsApi';
import { formatTime, timeAgo } from '../../shared/utils/format';
import { OTHER_CLASS, SEVERITY_CLASS } from '../overviewData';

export default function LogsPreviewRow({ log }: { log: Log }) {
  return (
    <div className="flex items-center border-b border-b-vigil-border px-3 sm:px-5 py-3 mono hover:bg-vigil-preview-hover transition-[background-color] duration-300">
      <div
        className="w-18 shrink-0 whitespace-nowrap text-xs me-4 text-vigil-muted-extra"
        title={formatTime(log.timestamp)}
      >
        {timeAgo(log.timestamp)}
      </div>
      <div className="flex items-center min-w-0">
        <div
          className={`shrink-0 text-xs tracking-widest uppercase py-0.5 w-18 text-center me-3 ${SEVERITY_CLASS[log.severity] ?? OTHER_CLASS}`}
        >
          {log.severity === 'warning' ? 'warn' : log.severity}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] mb-0.5 truncate">{log.message}</div>
          <div className="text-xs text-vigil-muted-extra">
            {log.service}
          </div>
        </div>
      </div>
    </div>
  );
}
