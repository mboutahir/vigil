import { darkBadge, roleBadge } from '../shared/severityColors';
import { faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Data {
  email: string;
  role: 'admin' | 'viewer';
  isCurrent: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function UserRow({
  email,
  role,
  isCurrent,
  onEdit,
  onDelete,
}: Data) {
  const isApiKeyUser = email === 'mustbe@api.email';

  return (
    <tr className="border-b border-vigil-border hover:bg-vigil-row-hover transition-colors duration-200">
      <td className="text-[14px] md:text-[16px] py-1 md:py-3 px-2 md:px-3">
        {email}
        {isCurrent && (
          <span className={`ms-3 uppercase text-xs tracking-wider text-vigil-warning px-2 py-1 ${darkBadge}`}>
            you
          </span>
        )}
        {isApiKeyUser && (
          <span className={`ms-3 uppercase text-xs tracking-wider text-vigil-signal-logs-text px-2 py-1 ${darkBadge}`}>
            API key identity
          </span>
        )}
      </td>
      <td className="py-1 md:py-3 px-2 md:px-3">
        <span
          className={`uppercase text-xs tracking-wider block w-15 md:w-18 text-center py-1 md:py-1.5 ${roleBadge(role)}`}
        >
          {role}
        </span>
      </td>
      <td className="py-2 md:py-3 px-2 md:px-3 space-x-2 whitespace-nowrap">
        {!isCurrent && (
          <>
            {!isApiKeyUser && (
              <button
                onClick={onEdit}
                className="text-xs md:text-[13px] cursor-pointer border border-vigil-border w-8 h-8 text-vigil-muted hover:border-vigil-text/60 hover:text-vigil-text/60 transition-[color,border-color] duration-200"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
            )}
            <button
              onClick={onDelete}
              className="text-xs md:text-[13px] cursor-pointer border border-vigil-state-danger/40 w-8 h-8 text-vigil-state-danger/70 hover:border-vigil-state-danger/80 hover:text-vigil-state-danger/80 transition-[color,border-color] duration-200"
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
