import { useState } from 'react';
import type { Severity } from '../../api/alertRulesApi';
import { formatTime, timeAgo } from '../shared/utils/format';
import LogsDetails from './LogsDetails';
import { borderColor, severityColors } from './colorsGuid';

export type LogsSeverity = Severity | 'error';

export type Attributes = Record<string, string>;

interface Data {
  timestamp: string;
  service: string;
  severity: LogsSeverity;
  message: string;
  attributes: Attributes;
  isLive?: boolean;
}

export default function LogsRow({
  timestamp,
  service,
  severity,
  message,
  attributes,
  isLive,
}: Data) {
  const [isOpen, setIsOpen] = useState(false);
  const levelColor = severityColors[severity];

  return (
    <>
      <tr
        className={`border-b border-vigil-border hover:bg-vigil-row-hover transition-colors duration-200 cursor-pointer relative after:absolute after:right-5 after:top-1/2 after:-translate-y-1/2 ${isOpen ? "after:content-['▴']" : "after:content-['▾']"} text-sm text-vigil-muted ${isLive ? 'animate-log-flash' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <td
          title={formatTime(timestamp)}
          className={`whitespace-nowrap border-l px-2 py-2.5 md:px-3 md:py-3 ${borderColor[severity]}`}
        >
          {timeAgo(timestamp)}
        </td>
        <td className="py-2.5 md:py-3 px-2 md:px-3">
          {service}
        </td>
        <td className="text-[13px] py-2.5 md:py-3 px-2 md:px-3">
          <span className={`px-2 py-1 mono ${levelColor}`}>{severity}</span>
        </td>
        <td className="w-full max-w-0 py-2.5 md:py-3 ps-2 md:ps-3 pe-12">
          <span className="block truncate">{message}</span>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={4}>
            <LogsDetails attributes={attributes} message={message} />
          </td>
        </tr>
      )}
    </>
  );
}
