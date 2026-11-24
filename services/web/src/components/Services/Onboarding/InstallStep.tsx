import type { ServiceOnboarding } from '../../../hooks/useServiceOnboarding';
import {
  runtimeGuides,
  type ServiceLanguage,
  type RuntimeGuide,
} from '../../../data/serviceOnboarding';
import CodeSnippet from './CodeSnippet';
import ServiceEnvironmentPicker from './ServiceEnvironmentPicker';
import StepShell from './StepShell';

const inputStyle =
  'mono mt-1 block w-full border border-vigil-border bg-vigil-card p-2.5 outline-none focus:border-vigil-accent';

interface Data {
  flow: ServiceOnboarding;
}

export default function InstallStep({ flow }: Data) {
  const { language, agentPath } = flow;
  const compose = flow.format === 'compose';
  const guide: RuntimeGuide | undefined = language
    ? runtimeGuides[language]
    : undefined;
  const dockerfile =
    language === 'java' && agentPath.trim()
      ? 'COPY ' + JSON.stringify(['opentelemetry-javaagent.jar', agentPath])
      : guide?.dockerfile;
  return (
    <StepShell title="Install OpenTelemetry">
      <div className="space-y-4 text-sm">
        <ServiceEnvironmentPicker
          format={flow.format}
          setFormat={flow.setFormat}
        />
        <label className="mt-2 block text-[13px] text-vigil-muted">
          Service language
          <select
            className={inputStyle}
            value={language}
            onChange={(e) =>
              flow.setLanguage(e.target.value as ServiceLanguage | '')
            }
          >
            <option value="">Choose a language</option>
            {Object.entries(runtimeGuides).map(([key, runtime]) => (
              <option value={key} key={key}>
                {runtime.label}
              </option>
            ))}
          </select>
        </label>
        {guide && (
          <div className="mt-2">
            <p className="leading-5 text-vigil-muted">
              {compose ? guide.dockerInstall : guide.install}{' '}
              <a
                href={guide.docs}
                target="_blank"
                rel="noreferrer"
                className="text-vigil-accent underline"
              >
                Installation guide ↗
              </a>
            </p>
            {guide.command && (!compose || language === 'node' || language === 'java') && (
              <CodeSnippet
                label={compose ? 'Run in the project directory' : 'Install'}
                code={guide.command}
              />
            )}
            {compose && dockerfile && (
              <CodeSnippet label="Dockerfile" code={dockerfile} />
            )}
            {language === 'python' && (
              <label className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={flow.legacyPythonSdk}
                  onChange={(e) => flow.setLegacyPythonSdk(e.target.checked)}
                />
                My service uses opentelemetry-sdk earlier than 1.40.0
              </label>
            )}
            {language === 'java' && (
              <label className="mt-2 block">
                Java agent JAR path
                <input
                  className={inputStyle}
                  value={agentPath}
                  onChange={(e) => flow.setAgentPath(e.target.value)}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </StepShell>
  );
}
