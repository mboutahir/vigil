export const darkBadge = 'rounded-(--vigil-radius-badge) border border-vigil-border bg-vigil-panel';

export function roleBadge(role?: string) {
  return `${darkBadge} ${role === 'admin' ? 'text-vigil-accent' : 'text-vigil-muted'}`;
}

export const severityColors = {
  critical: `${darkBadge} text-vigil-critical`,
  error: `${darkBadge} text-vigil-log-error`,
  warning: `${darkBadge} text-vigil-warning`,
  info: `${darkBadge} text-vigil-state-info-text`,
};
