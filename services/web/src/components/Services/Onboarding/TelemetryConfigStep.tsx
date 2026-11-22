import type { ServiceOnboarding } from '../../../hooks/useServiceOnboarding';
import {
  runtimeGuides,
  type RuntimeGuide,
} from '../../../data/serviceOnboarding';
import Button from '../../shared/Button';
import CodeSnippet from './CodeSnippet';
import StepShell from './StepShell';
import ServiceEnvironmentPicker from './ServiceEnvironmentPicker';
import ExporterSnippet from './ExporterSnippet';

const inputStyle =
  'mono mt-1 block w-full border border-vigil-border bg-vigil-card p-2.5 outline-none focus:border-vigil-accent';

interface Data {
  flow: ServiceOnboarding;
}

export default function TelemetryConfigStep({ flow }: Data) {
  const { existing, language, caPath, localTls, download, keys } = flow;
  const compose = flow.format === 'compose';
  const guide: RuntimeGuide | undefined =
    !existing && language ? runtimeGuides[language] : undefined;
  const collectorConfig = [
    'exporters:',
    '  otlphttp/vigil:',
    `    endpoint: ${JSON.stringify(flow.endpoint)}`,
    '    headers:',
    `      Authorization: ${JSON.stringify('Bearer ' + flow.ingestionKey)}`,
    ...(localTls
      ? ['    tls:', `      ca_file: ${JSON.stringify(caPath)}`]
      : []),
  ].join('\n');

  return (
    <StepShell title={`Connect ${flow.serviceName}`}>
      <div className="space-y-5 text-sm">
        <ServiceEnvironmentPicker
          format={flow.format}
          setFormat={flow.setFormat}
        />
        {flow.tls.isError && (
          <p role="alert" className="text-sm text-vigil-state-danger-text">
            {flow.tls.error.message}
          </p>
        )}
        {flow.tls.data?.status === 'pending' && (
          <p role="status" className="text-sm text-vigil-state-attention-text">
            Certificate setup is pending. Try switching again shortly.
          </p>
        )}
        {localTls && (
          <div className="space-y-2 border-t border-vigil-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Trust Vigil’s certificate</h3>
              <Button
                value={download.isPending ? 'Downloading…' : 'Download CA'}
                onClick={() => download.mutate()}
                disabled={download.isPending}
                className="px-3! py-1.5! text-xs!"
              />
            </div>
            <p className="text-vigil-muted">
              {compose ? (
                <>
                  Save the download as <code>./certs/vigil-ca.crt</code> beside
                  your Compose file. The generated mount makes it available at
                  the container path below.
                </>
              ) : (
                'Save or mount vigil-ca.crt at this path inside the service or Collector that sends telemetry.'
              )}
            </p>
            <details className="text-[13px]">
              <summary className="cursor-pointer text-vigil-accent">
                Certificate settings · {caPath}
              </summary>
              <label className="block text-[13px]">
                {compose
                  ? 'Certificate path inside the container'
                  : 'Certificate path'}
                <input
                  className={inputStyle}
                  value={caPath}
                  onChange={(e) => flow.setCaPath(e.target.value)}
                />
              </label>
              {compose && (
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={flow.privateCaMount}
                    onChange={(event) =>
                      flow.setPrivateCaMount(event.target.checked)
                    }
                  />
                  Apply a private SELinux label (:Z) to this service’s CA file
                </label>
              )}
            </details>
            {!caPath.startsWith('/') && (
              <p role="status" className="text-vigil-state-attention-text">
                Enter an absolute path, starting with /.
              </p>
            )}
            {!guide?.caEnv && (
              <p className="text-vigil-muted">
                Set your exporter’s trusted CA file to this path.
              </p>
            )}
            {download.isError && (
              <p role="alert" className="text-vigil-state-danger-text">
                {download.error.message}
              </p>
            )}
          </div>
        )}
        <div className="border-t border-vigil-border pt-4">
          <h3 className="font-semibold">Configure the exporter</h3>
          <p className="mt-1 text-vigil-muted">
            Apply these settings to your service environment. Keep the ingestion
            key private.
          </p>
          {keys.isPending ? (
            <p role="status">Loading ingestion key…</p>
          ) : keys.isError || !flow.ingestionKey ? (
            <div
              role="alert"
              className="mt-2 flex flex-wrap items-center gap-2"
            >
              <span>
                {keys.error?.message ?? 'No ingestion key is available.'}
              </span>
              <Button
                value="Retry"
                onClick={() => void keys.refetch()}
                disabled={keys.isFetching}
              />
            </div>
          ) : (
            flow.canConfigure && (
              <>
                <ExporterSnippet flow={flow} />
                {existing && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-vigil-accent">
                      Sending through an OpenTelemetry Collector?
                    </summary>
                    <p className="mt-2 text-vigil-muted">
                      Keep the service name on your application. Add this
                      exporter to the Collector pipelines that forward its
                      signals.
                    </p>
                    <CodeSnippet
                      label="Collector configuration"
                      code={collectorConfig}
                    />
                  </details>
                )}
              </>
            )
          )}
        </div>
      </div>
    </StepShell>
  );
}
