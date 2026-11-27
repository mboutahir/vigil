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

import { settingsNavigation } from '../../Settings/settingsNavigation';

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
  if (settingsNavigation.some((link) => link.path === pathname)) return 'settings';
  return 'page not found';
};

const standaloneTitles: Record<string, string> = {
  '/auth/login': 'Login',
  '/auth/setup': 'Account Setup',
  '/service-onboarding': 'Service Onboarding',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
};

export function getTabTitle(pathname: string) {
  const path = pathname.toLowerCase().replace(/\/+$/, '');
  if (!path) return 'Vigil';

  const settingsPage = settingsNavigation.find((link) => link.path === path);
  const title = settingsPage?.label ?? standaloneTitles[path] ?? getPageTitle(path);
  return title.replace(/\b[a-z]/g, (letter) => letter.toUpperCase()) + ' | Vigil';
}
