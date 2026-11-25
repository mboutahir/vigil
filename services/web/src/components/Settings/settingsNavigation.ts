import { faCircleUser, faDesktop, faUsers, faKey, faPlug } from '@fortawesome/free-solid-svg-icons';

export const settingsNavigation = [
  {
    label: 'My Account',
    icon: faCircleUser,
    path: '/settings/account',
  },
  {
    label: 'Sessions',
    icon: faDesktop,
    path: '/settings/sessions',
  },
  {
    label: 'Users',
    icon: faUsers,
    path: '/settings/users',
    adminOnly: true,
  },
  {
    label: 'API Keys',
    icon: faKey,
    path: '/settings/api-keys',
    adminOnly: true,
  },
  {
    label: 'Webhooks',
    icon: faPlug,
    path: '/settings/webhooks',
    adminOnly: true,
  },
];
