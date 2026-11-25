import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { NavLink } from 'react-router-dom';

interface Data {
  title: string;
  icon: IconDefinition;
  path: string;
}

export default function SidebarItem({ title, path, icon }: Data) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 py-2 ps-7 text-[14px] font-medium capitalize transition-colors ${
          isActive
            ? 'bg-vigil-row-hover text-vigil-text'
            : 'text-vigil-muted hover:bg-vigil-accent-soft hover:text-vigil-text'
        }`
      }
      end={path !== '/settings'}
    >
      {({ isActive }) => (
        <>
          <FontAwesomeIcon
            icon={icon}
            aria-hidden="true"
            className={`w-4! shrink-0 ${isActive ? 'text-vigil-accent' : ''}`}
          />
          {title}
        </>
      )}
    </NavLink>
  );
}
