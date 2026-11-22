import type { ServiceOnboarding } from '../../../hooks/useServiceOnboarding';
import ServiceEnvironmentPicker from './ServiceEnvironmentPicker';
import StepShell from './StepShell';

interface Data {
  flow: ServiceOnboarding;
}

export default function ServiceSetupStep({ flow }: Data) {
  const { tls } = flow;
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
        <fieldset disabled={tls.isPending} className="space-y-5">
          <ServiceEnvironmentPicker
            format={flow.format}
            setFormat={flow.setFormat}
          />
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
          <label className="block text-sm">
            Vigil HTTPS address
            <input
              required
              value={flow.address}
              onChange={(e) => flow.changeAddress(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="address-help"
              className="mono mt-2 block w-full border border-vigil-border bg-vigil-card p-3 outline-none focus:border-vigil-accent"
            />
          </label>
          <p
            id="address-help"
            className="text-[13px] leading-5 text-vigil-muted"
          >
            {flow.format === 'compose'
              ? 'On the same machine, use vigil.localhost and Vigil’s HTTPS port. The generated host-gateway mapping reaches Vigil through its published Docker port or a host HTTPS listener.'
              : 'On the same machine, use localhost and Vigil’s HTTPS port. If Vigil runs in Docker, use the port published on the host.'}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={flow.existing}
              onChange={(e) => flow.setExisting(e.target.checked)}
            />
            Already using OpenTelemetry? Skip installation
          </label>
        </fieldset>
        {tls.isError && (
          <p role="alert" className="mt-3 text-sm text-vigil-state-danger-text">
            {tls.error.message}
          </p>
        )}
        {tls.data?.status === 'pending' && (
          <p
            role="status"
            className="mt-3 text-sm text-vigil-state-attention-text"
          >
            Certificate setup is pending. Try again{' '}
            {tls.data.retry_after_seconds
              ? `in ${tls.data.retry_after_seconds} seconds`
              : 'shortly'}
            .
          </p>
        )}
      </form>
    </StepShell>
  );
}
