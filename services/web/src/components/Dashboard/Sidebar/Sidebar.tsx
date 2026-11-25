import { roleBadge } from '../../shared/severityColors';
import { faArrowRotateRight, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../auth/authContext';
import Logo from '../../shared/Logo';
import SidebarSection from './SidebarSection';
import { dashboardNavigation as sidebarSections } from './dashboardNavigation';
import type { AlertsStreamStatus } from '../../../hooks/useAlertsWebSocket';

interface Data {
  status: AlertsStreamStatus;
  onRetry: () => void;
}

export default function Sidebar({ status, onRetry }: Data) {
  const { user } = useAuth();

  return (
    <div className="sidebar h-dvh bg-vigil-surface w-65 md:w-65 pb-3 md:pb-4 flex flex-col">
      <div className="dashboard-header-height flex shrink-0 items-center justify-center">
        <Logo className="px-4 md:px-5" imageClassName="h-auto w-24 lg:w-30" />
      </div>
      <div className="font-heading sidebar-items min-h-0 overflow-y-auto border-b border-vigil-border py-4 mb-4 flex-1">
        {sidebarSections.map((section) => (
          <SidebarSection
            key={section.title}
            title={section.title}
            links={section.links}
          />
        ))}
      </div>
      <footer className="footer grid shrink-0 gap-3 px-3 text-xs">
        <div className="client-info flex items-center gap-2">
          <FontAwesomeIcon icon={faCircleUser} aria-hidden="true" className="shrink-0 text-vigil-muted" />
          <span className="client-mail min-w-0 wrap-anywhere text-xs leading-snug text-vigil-text" title={user?.email}>
            {user?.email}
          </span>
        </div>
        <div className="ws-stream grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 text-xs">
          <p role="status"
            className={
              {
                connecting: 'text-vigil-muted',
                connected: 'text-vigil-success',
                disconnected: 'text-vigil-state-danger',
              }[status]
            }
          >
            <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
            Alerts stream {status}
            {status === 'connecting' ? '…' : ''}
          </p>
          <span className={`client-role px-1.5 py-1 text-[11px] font-bold uppercase ${roleBadge(user?.role)}`}>
            {user?.role}
          </span>
          {status === 'disconnected' && (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Retry alerts stream connection"
              className="col-span-full mt-1 inline-flex min-h-8 cursor-pointer items-center gap-2 justify-self-start border border-vigil-border bg-vigil-card px-2.5 text-xs font-medium text-vigil-text hover:border-vigil-accent hover:text-vigil-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vigil-accent"
            >
              <FontAwesomeIcon icon={faArrowRotateRight} aria-hidden="true" />
              Retry
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-vigil-muted">
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-vigil-state-muted-text"
          >
            Privacy
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-vigil-state-muted-text"
          >
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
