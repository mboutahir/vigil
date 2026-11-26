import type { AlertsStreamStatus } from '../../../hooks/useAlertsWebSocket';
import Sidebar from './Sidebar';

interface Data {
  status: AlertsStreamStatus;
}

export default function DesktopSidebar({ status }: Data) {
  return (
    <aside className="hidden lg:block sticky top-0 h-screen">
      <Sidebar status={status} />
    </aside>
  );
}
