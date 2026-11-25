import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink, Outlet } from 'react-router-dom';
import { settingsNavigation } from './settingsNavigation';
import { useAuth } from '../../auth/authContext';
import { filterNavigation } from '../../auth/permissions';

export default function SettingsLayout() {
  const { user } = useAuth();
  const navigation = filterNavigation(settingsNavigation, user?.role === 'admin');
  return (
    <div className="flex flex-col min-w-0">
      <nav aria-label="Settings" className="font-heading mb-6 flex max-w-full gap-1 overflow-x-auto border-b border-vigil-border sm:gap-3">
        {navigation.map((nav) => (
          <NavLink
            key={nav.path}
            to={nav.path}
            className={({ isActive }) =>
              `relative inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-t-(--vigil-radius-control) px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-vigil-accent sm:px-4 ${
                isActive
                  ? 'font-semibold text-vigil-text after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-vigil-accent'
                  : 'text-vigil-muted hover:bg-vigil-row-hover hover:text-vigil-text'
              }`
            }
          >
            <FontAwesomeIcon icon={nav.icon} aria-hidden="true" className="hidden size-3.5! sm:inline-block" />
            {nav.label}
          </NavLink>
        ))}
      </nav>
      <main className="min-w-0 w-full">
        <Outlet />
      </main>
    </div>
  );
}
