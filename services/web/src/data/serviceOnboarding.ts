export type TlsMode = 'unknown' | 'local' | 'public';

export const stepLabels = ['Service', 'Install', 'Connect', 'Verify'];
export type OnboardingStep = 1 | 2 | 3 | 4;

export interface RuntimeGuide {
  label: string;
  install: string;
  docs: string;
  command?: string;
  launch?: string;
  dockerInstall: string;
  dockerfile?: string;
  caEnv?: string;
}

export type ServiceLanguage = 'python' | 'node' | 'java' | 'other';

export const runtimeGuides: Record<ServiceLanguage, RuntimeGuide> = {
  python: {
    label: 'Python',
    install: 'Run these commands in the Python environment your service uses.',
    command:
      'python -m pip install opentelemetry-distro opentelemetry-exporter-otlp\nopentelemetry-bootstrap -a install',
    launch: 'opentelemetry-instrument python myapp.py',
    dockerInstall:
      'In the final Python environment, add the RUN instructions after your application dependencies are installed. Prefix your existing startup command with opentelemetry-instrument. Replace myapp.py in this example with your entry point. If Compose overrides the image command, apply the same prefix there.',
    dockerfile:
      'RUN python -m pip install opentelemetry-distro opentelemetry-exporter-otlp\nRUN opentelemetry-bootstrap -a install\nCMD ["opentelemetry-instrument", "python", "myapp.py"]',
    docs: 'https://opentelemetry.io/docs/zero-code/python/',
    caEnv: 'OTEL_EXPORTER_OTLP_CERTIFICATE',
  },
  node: {
    label: 'Node.js',
    install: 'Install auto-instrumentation in your service directory.',
    command: 'npm install --save @opentelemetry/auto-instrumentations-node',
    dockerInstall:
      'From the project directory, add the package as a production dependency and save the updated package.json and lockfile. Your image’s dependency-install step must include it. The generated NODE_OPTIONS activates it at startup.',
    docs: 'https://opentelemetry.io/docs/zero-code/js/',
    caEnv: 'NODE_EXTRA_CA_CERTS',
  },
  java: {
    label: 'Java',
    install:
      'Download the OpenTelemetry Java agent and place the JAR where your JVM can read it.',
    dockerInstall:
      'Download opentelemetry-javaagent.jar into your Docker build context. Copy it into the final image at the JAR path below. Keep your usual Java startup command.',
    docs: 'https://opentelemetry.io/docs/zero-code/java/agent/getting-started/',
    caEnv: 'OTEL_EXPORTER_OTLP_CERTIFICATE',
  },
  other: {
    label: 'Other language',
    install:
      'Set up your language’s OpenTelemetry SDK with an OTLP/HTTP exporter.',
    dockerInstall:
      'Add the OpenTelemetry SDK and OTLP/HTTP exporter to your application dependencies. Install them during the image build and initialize the SDK in the process started by the container.',
    docs: 'https://opentelemetry.io/docs/languages/',
  },
};

export function shellQuote(value: string) {
  return "'" + value.replaceAll("'", "'\"'\"'") + "'";
}

interface ExporterSettings {
  serviceName: string;
  endpoint: string;
  ingestionKey: string;
  language: ServiceLanguage | '';
  existing: boolean;
  localTls: boolean;
  privateCaMount: boolean;
  caPath: string;
  agentPath: string;
}

export type ExporterFormat = 'compose' | 'bash';

function composeString(value: string) {
  // Compose expands dollar signs even inside quoted YAML values.
  return JSON.stringify(value.replaceAll('$', () => '$$'));
}

export function exporterConfig(
  settings: ExporterSettings,
  format: ExporterFormat,
) {
  const {
    serviceName,
    endpoint,
    ingestionKey,
    language,
    existing,
    localTls,
    caPath,
    agentPath,
  } = settings;
  const guide: RuntimeGuide | undefined = language
    ? runtimeGuides[language]
    : undefined;
  const env: Record<string, string> = {
    OTEL_SERVICE_NAME: serviceName,
    OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
    OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
    OTEL_EXPORTER_OTLP_HEADERS:
      'Authorization=Bearer%20' + encodeURIComponent(ingestionKey),
  };
  if (!existing) {
    env.OTEL_TRACES_EXPORTER = 'otlp';
    env.OTEL_METRICS_EXPORTER = 'otlp';
    env.OTEL_LOGS_EXPORTER = 'otlp';
    if (language === 'java')
      env.JAVA_TOOL_OPTIONS = '-javaagent:"' + agentPath + '"';
    if (language === 'node')
      env.NODE_OPTIONS =
        '--require @opentelemetry/auto-instrumentations-node/register';
  }
  const caEnv = existing ? 'OTEL_EXPORTER_OTLP_CERTIFICATE' : guide?.caEnv;
  if (localTls && caEnv) env[caEnv] = caPath;

  if (format === 'bash') {
    return Object.entries(env)
      .map(([name, value]) => {
        const prefix =
          name === 'JAVA_TOOL_OPTIONS' || name === 'NODE_OPTIONS'
            ? '"${' + name + ':+$' + name + ' }"'
            : '';
        return `export ${name}=${prefix}${shellQuote(value)}`;
      })
      .join('\n');
  }

  const lines = ['    environment:'];
  for (const [name, value] of Object.entries(env)) {
    const yaml =
      name === 'OTEL_EXPORTER_OTLP_HEADERS'
        ? '"Authorization=Bearer%20${VIGIL_INGESTION_KEY:?Set VIGIL_INGESTION_KEY in .env}"'
        : composeString(value);
    lines.push(`      ${name}: ${yaml}`);
  }
  if (localTls) {
    lines.push('    volumes:');
    if (caPath.includes(':')) {
      lines.push(
        '      - type: bind',
        '        source: ./certs/vigil-ca.crt',
        `        target: ${composeString(caPath)}`,
        '        read_only: true',
        ...(settings.privateCaMount
          ? ['        bind:', '          selinux: Z']
          : []),
      );
    } else {
      lines.push(
        '      - ' +
          composeString(
            './certs/vigil-ca.crt:' +
              caPath +
              (settings.privateCaMount ? ':ro,Z' : ':ro'),
          ),
      );
    }
  }
  const host = new URL(endpoint).hostname;
  if (host === 'vigil.localhost' || host === 'host.docker.internal') {
    lines.push(
      '    extra_hosts:',
      '      - ' + composeString(host + ':host-gateway'),
    );
  }
  return lines.join('\n');
}
