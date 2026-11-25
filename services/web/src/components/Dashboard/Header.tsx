import LogoutButton from '../shared/LogoutButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../shared/Button';
import { useNavigate } from 'react-router-dom';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import AlertNotificationsPage from '../../pages/AlertNotifications/AlertNotificationsPage';
import { useAuth } from '../../auth/authContext';
import { isAdmin } from '../../auth/permissions';

interface Data {
  title: string | undefined;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: Data) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="header dashboard-header-height sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-b-vigil-border bg-inherit px-2 sm:px-4 text-center md:px-8">
      <div className="right-section flex min-w-0 items-center">
        <button
          onClick={onMenuClick}
          className="me-2 sm:me-5 block cursor-pointer lg:hidden"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <h1 className="me-2 sm:me-5 text-[18px] font-bold uppercase tracking-[0.06em]! md:tracking-[0.09em]! md:text-2xl lg:text-[26px]">
          {title}
        </h1>
      </div>
      <div className="left-section flex items-center gap-2 sm:gap-4">
        <AlertNotificationsPage />
        {user && isAdmin(user.role) && (
          <Button
            onClick={() => navigate('/add-service')}
            value="add service"
            className="tracking-wide! font-medium! uppercase! text-xs! lg:text-[12.5px]! py-1.75! px-2! sm:px-4!"
          />
        )}
        <LogoutButton />
      </div>
    </div>
  );
}
