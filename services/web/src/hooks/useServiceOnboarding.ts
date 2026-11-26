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

export default function useServiceOnboarding(apiFetch: ApiFetch) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [serviceName, setServiceName] = useState('');
  const [format, setFormat] = useState<ExporterFormat>('compose');
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

  const port = window.location.protocol === 'https:' ? window.location.port : '8443';
  const endpoint = `https://localhost${port ? ':' + port : ''}/otlp`;
  const ingestionKey = keys.data?.ingestion_key ?? '';
  const canInstall =
    Boolean(language) && (language !== 'java' || Boolean(agentPath.trim()));
  const canConfigure =
    (existing || canInstall) &&
    caPath.startsWith('/') &&
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
    endpoint,
    keys,
    ingestionKey,
    download,
    format,
    setFormat,
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
