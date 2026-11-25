import { faBell } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Data {
  notificationNumber: number;
  onClick: () => void;
}

export default function AlertNotificationButton({
  notificationNumber,
  onClick,
}: Data) {
  const hasUnread = notificationNumber > 0;

  return (
    <button
      type="button"
      aria-label={hasUnread ? `Notifications, ${notificationNumber} unread` : 'Notifications'}
      onClick={onClick}
      className={`relative grid size-8.5 cursor-pointer place-items-center border text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vigil-accent ${
        hasUnread
          ? 'border-vigil-accent-border-selected bg-vigil-accent-badge text-vigil-accent hover:bg-vigil-accent-selected'
          : 'border-vigil-border bg-vigil-card text-vigil-muted hover:border-vigil-border-hover hover:text-vigil-text'
      }`}
    >
      <FontAwesomeIcon icon={faBell} />
      {hasUnread && (
        <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-vigil-accent px-1 text-center text-xs leading-4 font-bold text-vigil-on-accent tabular-nums">
          {notificationNumber}
        </span>
      )}
    </button>
  );
}
