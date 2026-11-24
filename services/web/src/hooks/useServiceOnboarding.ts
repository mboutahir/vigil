import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ExporterFormat,
  OnboardingStep,
  ServiceLanguage,
} from '../data/serviceOnboarding';
import { getApiKeys } from '../api/apiKeyApi';
import type { ApiFetch } from '../api/api';
import { getTlsCa } from '../api/serviceOnboardingApi';

// vigil's address as seen from the service: same port as this page, and vigil.localhost from inside docker
function vigilAddress(format: ExporterFormat) {
  const url = new URL(
    window.location.protocol === 'https:'
      ? window.location.origin
      : 'https://localhost:8443',
  );
  if (format === 'compose' && url.hostname === 'localhost')
    url.hostname = 'vigil.localhost';
  return url.origin;
}

export default function useServiceOnboarding(apiFetch: ApiFetch) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [serviceName, setServiceName] = useState('');
  const [format, updateFormat] = useState<ExporterFormat>('compose');
  const [existing, setExisting] = useState(false);
  const [language, setLanguage] = useState<ServiceLanguage | ''>('');
  const [legacyPythonSdk, setLegacyPythonSdk] = useState(false);
  const [privateCaMount, setPrivateCaMount] = useState(false);
  const [caPath, setCaPath] = useState('/etc/vigil/vigil-ca.crt');
  const [agentPath, setAgentPath] = useState(
    '/app/opentelemetry-javaagent.jar',
  );

  const keys = useQuery({
    queryKey: ['apiKeys'],
    staleTime: 60_000,
    queryFn: () => getApiKeys(apiFetch),
    enabled: step === 3,
  });
  const download = useMutation({
    mutationFn: async () => {
      const key = ['tls-ca'];
      const cached = queryClient.getQueryData<Blob>(key);
      if (cached) return cached;
      const certificate = await getTlsCa();
      queryClient.setQueryData(key, certificate);
      return certificate;
    },
    onSuccess(blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vigil-ca.crt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    },
  });

  // vigil runs on this machine behind caddy's local CA, so services always need to trust that CA
  const localTls = true;
  const endpoint = `${vigilAddress(format)}/otlp`;
  const ingestionKey = keys.data?.ingestion_key ?? '';
  const canInstall =
    Boolean(language) && (language !== 'java' || Boolean(agentPath.trim()));
  const canConfigure =
    (existing || canInstall) &&
    (!localTls || caPath.startsWith('/')) &&
    Boolean(ingestionKey) &&
    !keys.isError;

  function next() {
    if (step === 1 && serviceName.trim()) {
      setServiceName((name) => name.trim());
      setStep(existing ? 3 : 2);
    } else if (step === 2 && canInstall) {
      setStep(3);
    } else if (step === 3 && canConfigure) {
      setStep(4);
    }
  }

  return {
    step,
    back() {
      if (step === 4) setStep(3);
      else if (step === 3 && !existing) setStep(2);
      else setStep(1);
    },
    serviceName,
    setServiceName,
    localTls,
    endpoint,
    keys,
    ingestionKey,
    download,
    format,
    setFormat: updateFormat,
    privateCaMount,
    setPrivateCaMount,
    existing,
    setExisting,
    language,
    setLanguage,
    legacyPythonSdk,
    setLegacyPythonSdk,
    caPath,
    setCaPath,
    agentPath,
    setAgentPath,
    canInstall,
    canConfigure,
    next,
  };
}

export type ServiceOnboarding = ReturnType<typeof useServiceOnboarding>;
