import { darkBadge } from '../shared/severityColors';
export { severityColors } from '../shared/severityColors';

export const statusColors = {
  sent: `${darkBadge} text-vigil-muted`,
  resolved: `${darkBadge} text-vigil-success`,
  acknowledged: `${darkBadge} text-vigil-state-info-text`,
};

export const severityActive = {
  critical: 'bg-vigil-critical-active border-vigil-critical',
  warning: 'bg-vigil-warning-active border-vigil-warning',
  info: 'bg-vigil-state-info/20 border-vigil-state-info-text',
};
