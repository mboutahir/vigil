import { exporterConfig } from '../../../data/serviceOnboarding';
import type { ServiceOnboarding } from '../../../hooks/useServiceOnboarding';
import CodeSnippet from './CodeSnippet';

interface Data {
  flow: ServiceOnboarding;
}

export default function ExporterSnippet({ flow }: Data) {
  const { format } = flow;
  const compose = format === 'compose';

  return (
    <div className="mt-3">
      <p className="mt-3 text-vigil-muted">
        {compose
          ? 'Merge these entries under your service in docker-compose.yml.'
          : 'Run these exports in the same shell you use to start the service.'}
      </p>
      {compose && new URL(flow.endpoint).hostname === 'localhost' && (
        <p className="mt-2 text-vigil-state-attention-text">
          In a container, localhost points to the container itself. For a
          service on a bridge network, go back and use vigil.localhost with
          Vigil’s published HTTPS port.
        </p>
      )}
      <CodeSnippet
        label={compose ? 'docker-compose.yml' : 'Bash'}
        code={exporterConfig(flow, format)}
      />
      {compose && (
        <div className="mt-3 space-y-2 text-[13px] text-vigil-muted">
          <details>
            <summary className="cursor-pointer text-vigil-accent">
              Set the ingestion key in .env
            </summary>
            <p className="mt-2">
              Save this line in the .env file beside docker-compose.yml. Keep it
              private.
            </p>
            <CodeSnippet
              label=".env"
              code={
                'VIGIL_INGESTION_KEY=' +
                JSON.stringify(encodeURIComponent(flow.ingestionKey))
              }
            />
          </details>
          {!flow.existing &&
            (flow.language === 'java' || flow.language === 'node') && (
              <p>
                If your service already sets{' '}
                {flow.language === 'java'
                  ? 'JAVA_TOOL_OPTIONS'
                  : 'NODE_OPTIONS'}
                , append the instrumentation option to its existing value.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
