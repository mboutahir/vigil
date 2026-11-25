import {
  faGaugeHigh,
  faBell,
  faList,
  faChartLine,
  faDiagramProject,
  faCirclePlus,
  faSliders,
  faGear,
} from '@fortawesome/free-solid-svg-icons';

export const dashboardNavigation = [
  {
    title: 'monitor',
    links: [
      { label: 'overview', icon: faGaugeHigh, path: '/overview' },
      { label: 'alerts', icon: faBell, path: '/alerts' },
    ],
  },
  {
    title: 'telemetry',
    links: [
      { label: 'logs', icon: faList, path: '/logs' },
      { label: 'metrics', icon: faChartLine, path: '/metrics' },
      { label: 'traces', icon: faDiagramProject, path: '/traces' },
    ],
  },
  {
    title: 'configure',
    links: [
      { label: 'add service', icon: faCirclePlus, path: '/add-service', adminOnly: true },
      { label: 'alert rules', icon: faSliders, path: '/alert-rules', adminOnly: true },
      { label: 'settings', icon: faGear, path: '/settings' },
    ],
  },
];

export const getPageTitle = (pathname: string) => {
  for (const section of dashboardNavigation) {
    const link = section.links.find((link) => link.path === pathname);
    if (link) return link.label;
  }
  if (pathname.startsWith('/settings/')) return 'settings';
  return 'page not found';
};
