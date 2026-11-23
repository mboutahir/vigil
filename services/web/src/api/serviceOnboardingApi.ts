import axios from 'axios';

interface ApiError {
  message?: string;
  error?: string;
  code?: string;
}

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error && !axios.isAxiosError(error)) {
    return error;
  }

  if (axios.isAxiosError<ApiError>(error)) {
    const body = error.response?.data;
    const message = body?.message ?? body?.error;

    if (typeof message === 'string' && message) {
      return new Error(message, {
        cause: error,
      });
    }

    if (!error.response) {
      return new Error('Unable to connect to the server.', {
        cause: error,
      });
    }
  }
  return new Error(fallback, {
    cause: error,
  });
}

// served by the WAF's nginx outside /api, so it needs no login
async function getTlsCa(): Promise<Blob> {
  try {
    const res = await axios.get<Blob>('/config/tls/ca', {
      responseType: 'blob',
    });
    return res.data;
  } catch (error) {
    throw toError(error, 'Unable to download VIGIL CA certificate.');
  }
}

export { getTlsCa };
