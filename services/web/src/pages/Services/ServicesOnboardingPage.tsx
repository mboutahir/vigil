import { useNavigate } from 'react-router-dom';
import ServiceOnboardingWizard from '../../components/Services/Onboarding/ServiceOnboardingWizard';

export default function ServicesOnboardingPage() {
  const navigate = useNavigate();

  return (
    <main className="h-full overflow-hidden px-4 md:px-8">
      <div className="mx-auto flex h-full max-w-205 flex-col">
        <div className="mb-6 text-center">
          <p className="text-[12px] text-vigil-state-verified-text">
            YOUR ADMIN ACCOUNT IS READY
          </p>
          <h1 className="mb-2 text-[25px] font-semibold md:text-[36px]">
            Connect your first service
          </h1>
        </div>
        <ServiceOnboardingWizard
          firstStepActionLabel="skip for now"
          onExit={() => navigate('/overview')}
          onAddAnother={() => navigate('/add-service')}
        />
      </div>
    </main>
  );
}
