import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../auth/authContext';
import { filterNavigation } from '../../../auth/permissions';
import SidebarItem from './SidebarItem';

interface Link {
  label: string;
  icon: IconDefinition;
  path: string;
  adminOnly?: boolean;
}

interface Data {
  title: string;
  links: Link[];
}
export default function SidebarSection({ title, links }: Data) {
  const { user } = useAuth();
  const navigation = filterNavigation(links, user?.role === 'admin');

  return (
    <div className="sidebar-section flex flex-col mt-1 mb-3">
      <h1 className="sidebar-section-title text-xs md:text-[12px] uppercase text-vigil-muted-extra ms-5 mb-1 tracking-wider!">
        {title}
      </h1>
      {navigation.map((nav) => (
        <SidebarItem key={nav.path} title={nav.label} path={nav.path} icon={nav.icon} />
      ))}
    </div>
  );
}
