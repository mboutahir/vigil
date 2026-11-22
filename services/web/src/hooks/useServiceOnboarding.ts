import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ExporterFormat,
  OnboardingStep,
  ServiceLanguage,
} from '../data/serviceOnboarding';
import { getApiKeys } from '../api/apiKeyApi';
import type { ApiFetch } from '../api/api';
import {
  type ConfigureTlsAddressResponse,
  configureTlsAddress,
  getTlsCa,
} from '../api/serviceOnboardingApi';

function suggestedAddress(format: ExporterFormat) {
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
  const [address, setAddress] = useState(() => suggestedAddress('compose'));
  const [format, updateFormat] = useState<ExporterFormat>('compose');
  const [existing, setExisting] = useState(false);
  const [language, setLanguage] = useState<ServiceLanguage | ''>('');
  const [privateCaMount, setPrivateCaMount] = useState(false);
  const [caPath, setCaPath] = useState('/etc/vigil/vigil-ca.crt');
  const [agentPath, setAgentPath] = useState(
    '/app/opentelemetry-javaagent.jar',
  );

  const [connection, setConnection] =
    useState<ConfigureTlsAddressResponse | null>(null);
  const tls = useMutation({
    mutationFn: async (value: string) => {
      const key = ['tls-address', value];
      const cached = queryClient.getQueryData<ConfigureTlsAddressResponse>(key);
      if (cached) return cached;
      const result = await configureTlsAddress(apiFetch, value);
      if (result.status === 'verified') queryClient.setQueryData(key, result);
      return result;
    },
  });

  function verify(value: string, onVerified: () => void) {
    tls.mutate(value, {
      onSuccess(result) {
        if (result.status !== 'verified') return;
        setConnection(result);
        setAddress(result.address);
        onVerified();
      },
    });
  }
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
      const certificate = await getTlsCa(apiFetch);
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

  const localTls = connection?.tls_mode === 'local';
  const endpoint = connection?.otlp_endpoint ?? `${address}/otlp`;
  const ingestionKey = keys.data?.ingestion_key ?? '';
  const canInstall =
    Boolean(language) && (language !== 'java' || Boolean(agentPath.trim()));
  const canConfigure =
    (existing || canInstall) &&
    (!localTls || caPath.startsWith('/')) &&
    Boolean(ingestionKey) &&
    !keys.isError;

  function next() {
    if (step === 1 && serviceName.trim() && address.trim() && !tls.isPending) {
      const origin = address.trim().replace(/\/+$/, '');
      verify(origin.includes('://') ? origin : `https://${origin}`, () => {
        setServiceName((name) => name.trim());
        setStep(existing ? 3 : 2);
      });
    } else if (step === 2 && canInstall) {
      setStep(3);
    } else if (step === 3 && canConfigure && !tls.isPending) {
      setStep(4);
    }
  }

  return {
    step,
    back() {
      tls.reset();
      if (step === 4) setStep(3);
      else if (step === 3 && !existing) setStep(2);
      else setStep(1);
    },
    serviceName,
    setServiceName,
    address,
    changeAddress(value: string) {
      tls.reset();
      setAddress(value);
    },
    tls,
    localTls,
    endpoint,
    keys,
    ingestionKey,
    download,
    format,
    setFormat(nextFormat: ExporterFormat) {
      tls.reset();
      const nextAddress = suggestedAddress(nextFormat);
      if (address === suggestedAddress(format) && address !== nextAddress) {
        if (step === 3) {
          verify(nextAddress, () => updateFormat(nextFormat));
          return;
        }
        setAddress(nextAddress);
      }
      updateFormat(nextFormat);
    },
    privateCaMount,
    setPrivateCaMount,
    existing,
    setExisting,
    language,
    setLanguage,
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
