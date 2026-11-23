import type { ServiceOnboarding } from '../../../hooks/useServiceOnboarding';
import StepShell from './StepShell';

interface Data {
  flow: ServiceOnboarding;
}

export default function ServiceSetupStep({ flow }: Data) {
  return (
    <StepShell
      title="Service details"
      description="Choose the service name you want to see in Vigil."
    >
      <form
        id="service-details"
        onSubmit={(event) => {
          event.preventDefault();
          flow.next();
        }}
      >
        <fieldset className="space-y-5">
          <label className="block text-sm">
            Service name
            <input
              required
              value={flow.serviceName}
              onChange={(e) => flow.setServiceName(e.target.value)}
              placeholder="checkout-api"
              autoComplete="off"
              spellCheck={false}
              className="mt-2 block w-full border border-vigil-border bg-vigil-card p-3 outline-none focus:border-vigil-accent"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={flow.existing}
              onChange={(e) => flow.setExisting(e.target.checked)}
            />
            Already using OpenTelemetry? Skip installation
          </label>
        </fieldset>
      </form>
    </StepShell>
  );
}
