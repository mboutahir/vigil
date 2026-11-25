import {
  faArrowTrendUp,
  faFire,
  faServer,
  faUserClock,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { darkBadge } from '../../shared/severityColors';
import type { KpiState } from './KpiCardData';

const ICONS: Record<KpiState, { icon: IconDefinition; color: string }> = {
  critical: { icon: faFire, color: 'text-vigil-critical' },
  warning: { icon: faArrowTrendUp, color: 'text-vigil-warning' },
  unack: { icon: faUserClock, color: 'text-vigil-state-info-text' },
  healthy: { icon: faServer, color: 'text-vigil-state-success-text' },
};

interface Data {
  cardIcon: KpiState;
}

export default function KpiCardIcon({ cardIcon }: Data) {
  const { icon, color } = ICONS[cardIcon];
  return (
    <span className={`me-3 inline-flex size-8 shrink-0 items-center justify-center ${darkBadge} ${color}`} aria-hidden="true">
      <FontAwesomeIcon className="size-4!" icon={icon} />
    </span>
  );
}
