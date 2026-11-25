import { useState } from 'react';
import useServiceOnboarding from '../../../hooks/useServiceOnboarding';
import { useAuth } from '../../../auth/authContext';
import {
  runtimeGuides,
  shellQuote,
  type RuntimeGuide,
} from '../../../data/serviceOnboarding';
import Button from '../../shared/Button';
import InstallStep from './InstallStep';
import ServiceSetupStep from './ServiceSetupStep';
import TelemetryConfigStep from './TelemetryConfigStep';
import VerifyTelemetryStep from './VerifyTelemetryStep';
import OnboardingProgress from './OnboardingProgress';

interface Data {
  onExit: () => void;
  firstStepActionLabel: string;
  onAddAnother?: () => void;
}

export default function ServiceOnboardingWizard(props: Data) {
  const [session, setSession] = useState(0);
  return (
    <Wizard
      key={session}
      {...props}
      onAddAnother={props.onAddAnother ?? (() => setSession(session + 1))}
    />
  );
}

function Wizard({ onExit, firstStepActionLabel, onAddAnother }: Data) {
  const { apiFetch, accessToken } = useAuth();
  const flow = useServiceOnboarding(apiFetch);
  const { step } = flow;
  const guide: RuntimeGuide | undefined =
    !flow.existing && flow.language ? runtimeGuides[flow.language] : undefined;

  return (
    <>
      <OnboardingProgress step={step} existing={flow.existing} />
      <div className="rounded-(--vigil-radius-panel) flex min-h-0 flex-1 flex-col border border-vigil-border bg-vigil-card p-5 md:p-7">
        {step === 1 && <ServiceSetupStep flow={flow} />}
        {step === 2 && <InstallStep flow={flow} />}
        {step === 3 && <TelemetryConfigStep flow={flow} />}
        {step === 4 && (
          <VerifyTelemetryStep
            serviceName={flow.serviceName}
            accessToken={accessToken}
            compose={flow.format === 'compose'}
            launch={guide?.launch}
            onAddAnother={onAddAnother ?? onExit}
            reachabilityCommand={`curl -v --connect-timeout 5 --max-time 10${flow.localTls ? ' --cacert ' + shellQuote(flow.caPath) : ''} ${shellQuote(flow.endpoint + '/v1/logs')}`}
          />
        )}
        <div className="mt-5 flex shrink-0 items-center justify-between gap-2">
          <Button
            value={step === 1 ? firstStepActionLabel : 'Back'}
            onClick={step === 1 ? onExit : flow.back}
            className="border! border-vigil-border! bg-transparent! text-vigil-muted!"
          />
          {step === 1 && (
            <button
              type="submit"
              form="service-details"
              disabled={!flow.serviceName.trim()}
              className="cursor-pointer bg-vigil-accent px-5 py-3 text-[13px] font-medium uppercase text-vigil-on-accent disabled:opacity-50"
            >
              Get instructions
            </button>
          )}
          {step === 2 && (
            <Button
              value="Connection settings"
              onClick={flow.next}
              disabled={!flow.canInstall}
              className="disabled:opacity-50"
            />
          )}
          {step === 3 && (
            <Button
              value="Verify connection"
              onClick={flow.next}
              disabled={!flow.canConfigure}
              className="disabled:opacity-50"
            />
          )}
        </div>
      </div>
    </>
  );
}
