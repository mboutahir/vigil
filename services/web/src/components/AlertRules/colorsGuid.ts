import { darkBadge, severityColors } from '../shared/severityColors';

export const colors = {
  metrics: `${darkBadge} text-vigil-state-info-text`,
  logs: `${darkBadge} text-vigil-signal-logs-text`,
  traces: `${darkBadge} text-vigil-warning`,
  ...severityColors,
};
