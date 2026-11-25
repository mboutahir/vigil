import { darkBadge } from '../shared/severityColors';
import type { TraceStatus } from '../../api/tracesApi';

export const statusColors: Record<TraceStatus, string> = {
  ok: `${darkBadge} text-vigil-success`,
  error: `${darkBadge} text-vigil-critical`,
  unset: `${darkBadge} text-vigil-muted-extra`,
};

export function durationColor(ms: number): string {
  if (ms > 800) return 'bg-vigil-critical';
  if (ms < 60) return 'bg-vigil-success';
  return 'bg-vigil-warning';
}
