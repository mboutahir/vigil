import { Link } from 'react-router-dom';
import Button from '../../shared/Button';
import StepShell from './StepShell';
import useTelemetryVerification from '../../../hooks/useTelemetryVerification';
import CodeSnippet from './CodeSnippet';

interface Data {
  serviceName: string;
  accessToken: string | null;
  compose: boolean;
  launch?: string;
  reachabilityCommand: string;
  onAddAnother: () => void;
}

const buttonAnimation = 'transition-transform duration-150 active:scale-[0.98]';

interface SignalData {
  name: string;
  received: boolean;
}

function SignalStatus({ name, received }: SignalData) {
  return (
    <div
      className={`border px-3 py-2 text-[12px] ${
        received
          ? 'border-vigil-state-verified/40 text-vigil-state-verified-text'
          : 'border-vigil-border text-vigil-muted'
      }`}
    >
      {name} · {received ? 'received' : 'waiting'}
    </div>
  );
}

export default function VerifyTelemetryStep({
  serviceName,
  accessToken,
  launch,
  compose,
  reachabilityCommand,
  onAddAnother,
}: Data) {
  const {
    received,
    hasAnyTelemetry,
    allTelemetryReceived,
    hasStreamError,
    missingToken,
    retry,
  } = useTelemetryVerification({ enabled: true, serviceName, accessToken });
  return (
    <StepShell
      title="Confirm telemetry is arriving"
      description={
        compose
          ? 'Run this in the application’s Compose directory to apply the image, environment, and mount changes. Then send a request to the application and watch for its first signal.'
          : 'Restart your service with the connection settings, then make a request. The first log, trace, or metric confirms the connection.'
      }
    >
      {compose && (
        <div className="mb-4">
          <CodeSnippet
            label="Start from the Compose directory"
            code="docker compose config --quiet && docker compose up -d --build"
          />
        </div>
      )}
      {!compose && launch && (
        <div className="mb-4">
          <CodeSnippet
            label="Launch (replace myapp.py with your entry point)"
            code={launch}
          />
        </div>
      )}
      <div className="mb-5 flex flex-wrap gap-2">
        <SignalStatus name="Logs" received={received.logs} />
        <SignalStatus name="Traces" received={received.traces} />
        <SignalStatus name="Metrics" received={received.metrics} />
      </div>
      <div className="rounded-(--vigil-radius-panel) border border-vigil-border bg-vigil-card p-4">
        {missingToken ? (
          <>
            <h3 className="text-[15px] font-semibold text-vigil-state-danger-text">
              Authentication unavailable
            </h3>
            <p className="mt-2 text-[13px] leading-5 text-vigil-muted">
              VIGIL does not currently have an access token for the live
              telemetry connection.
            </p>
          </>
        ) : hasAnyTelemetry ? (
          <>
            <h3 className="text-[15px] font-semibold text-vigil-state-verified-text">
              Telemetry received from {serviceName}
            </h3>
            <p className="mt-2 text-[13px] leading-5 text-vigil-muted">
              {allTelemetryReceived
                ? 'Logs, traces, and metrics have all arrived.'
                : 'Connectivity is confirmed. Signals still marked waiting may need more application traffic or additional instrumentation.'}
            </p>
          </>
        ) : (
          <>
            <h3 className="text-[15px] font-semibold">
              Waiting for telemetry from {serviceName}...
            </h3>
            <p className="mt-2 text-[13px] leading-5 text-vigil-muted">
              Keep this page open while your service sends logs, traces, or
              metrics.
            </p>
          </>
        )}
      </div>
      {hasStreamError && !hasAnyTelemetry && (
        <div className="mt-4">
          <p className="mb-3 text-[13px] text-vigil-state-danger-text">
            One or more live telemetry streams could not connect. EventSource
            retries automatically, but you can also restart the check.
          </p>
          <Button
            value="RETRY TELEMETRY CHECK"
            onClick={retry}
            className={buttonAnimation}
          />
        </div>
      )}
      {hasAnyTelemetry && (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Link
              to="/traces"
              className="border border-vigil-border p-4 text-[13px] transition-colors hover:border-vigil-accent"
            >
              View traces →
            </Link>
            <Link
              to="/metrics"
              className="border border-vigil-border p-4 text-[13px] transition-colors hover:border-vigil-accent"
            >
              View metrics →
            </Link>
            <Link
              to="/logs"
              className="border border-vigil-border p-4 text-[13px] transition-colors hover:border-vigil-accent"
            >
              View logs →
            </Link>
          </div>
          <div className="mt-5">
            <Button
              value="ADD ANOTHER SERVICE"
              onClick={onAddAnother}
              className={buttonAnimation}
            />
          </div>
        </>
      )}
      <details className="mt-6 border-t border-vigil-border pt-4">
        <summary className="cursor-pointer text-[13px] font-medium">
          No data appears?
        </summary>
        <p className="mt-3 text-[13px] leading-5 text-vigil-muted">
          Confirm that OTEL_SERVICE_NAME matches{' '}
          <code className="mono">{serviceName}</code>, the service can reach the
          selected VIGIL address, OTLP/HTTP is being used, the ingestion header
          is present, and the exporter is not reporting TLS or connection
          errors.
        </p>
        {compose && (
          <p className="mt-2 text-[13px] text-vigil-muted">
            Choose the sending service from the names printed below. Check its
            logs for exporter errors. The HTTPS check runs inside that container
            and requires curl in its image.
          </p>
        )}
        <CodeSnippet
          label={
            compose
              ? 'Check the sending container'
              : 'Test HTTPS from the sending service'
          }
          code={
            compose
              ? [
                  'docker compose config --services',
                  "printf 'Compose service: '",
                  'read -r service',
                  'docker compose logs --tail=50 -- "$service"',
                  'docker compose exec -T -- "$service" ' + reachabilityCommand,
                ].join('\n')
              : reachabilityCommand
          }
        />
        <p className="mt-2 text-[13px] text-vigil-muted">
          An HTTP response such as 401 or 405 confirms the endpoint is reachable
          over HTTPS.
        </p>
      </details>
    </StepShell>
  );
}
