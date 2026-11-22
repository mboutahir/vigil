import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/authContext';
import { getMetricNames } from '../api/metricsApi';

//metric names for the alert rule form, only fetched when the rule is about metrics
export default function useMetricNames(enabled = true) {
  const { apiFetch } = useAuth();

  return useQuery({
    queryKey: ['metric-names'],
    queryFn: () => getMetricNames(apiFetch),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
