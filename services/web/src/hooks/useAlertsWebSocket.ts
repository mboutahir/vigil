import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/authContext';
import type { AlertHistory, AlertStatusUpdate } from '../api/alertHistoryApi';
import type { AlertNotification } from '../api/alertNotificationsApi';

export type AlertsStreamStatus = 'connecting' | 'connected' | 'reconnecting';

const MAX_RECONNECT_DELAY_MS = 30_000;

type WsAlertHistory = (Omit<AlertHistory, 'id'> | Omit<AlertStatusUpdate, 'id'>) & {
  alert_history_id: string;
};

export type LlmUpdate = {
  id: string;
  status: string;
  llm_analysis: string;
};

type AlertWsFrame =
  | { type: 'alert'; data: WsAlertHistory }
  | { type: 'Notification'; data: AlertNotification }
  | { type: 'llm'; data: LlmUpdate }
  | { type: 'error'; message: string };

interface Data {
  onAlert: (alert: AlertHistory | AlertStatusUpdate) => void;
  onLlm: (data: LlmUpdate) => void;
  onServerError: (message: string) => void;
  onReconnect: () => void;
  onNotification: (notification: AlertNotification) => void;
}

function normalizeWsAlert(data: WsAlertHistory): AlertHistory | AlertStatusUpdate {
  const { alert_history_id, ...rest } = data;

  return {
    ...rest,
    id: alert_history_id,
  };
}

export default function useAlertsWebSocket({
  onAlert,
  onLlm,
  onServerError,
  onReconnect,
  onNotification,
}: Data) {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<AlertsStreamStatus>('connecting');
  const needsResync = useRef(false);
  const onAlertRef = useRef(onAlert);
  const onLlmRef = useRef(onLlm);
  const onServerErrorRef = useRef(onServerError);
  const onReconnectRef = useRef(onReconnect);
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onAlertRef.current = onAlert;
    onLlmRef.current = onLlm;
    onServerErrorRef.current = onServerError;
    onReconnectRef.current = onReconnect;
    onNotificationRef.current = onNotification;
  }, [onAlert, onLlm, onServerError, onReconnect, onNotification]);

  useEffect(() => {
    if (!accessToken) return;

    let ws: WebSocket | null = null;
    let stopped = false;
    let reconnectTimer: number | undefined;
    let attempts = 0;

    const connect = () => {
      ws = new WebSocket(
        `/api/alerts/ws?token=${encodeURIComponent(accessToken)}`,
      );

      ws.onopen = () => {
        if (stopped) return;
        attempts = 0;
        setStatus('connected');
        if (needsResync.current) onReconnectRef.current();
        needsResync.current = false;
      };

      ws.onclose = () => {
        if (stopped) return;
        needsResync.current = true;
        setStatus('reconnecting');
        const delay = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** attempts);
        attempts += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };

      ws.onmessage = (event) => {
        let frame: AlertWsFrame;

        try {
          frame = JSON.parse(event.data) as AlertWsFrame;
        } catch {
          // Ignore malformed frames.
          return;
        }

        switch (frame.type) {
          case 'alert':
            onAlertRef.current(normalizeWsAlert(frame.data));
            break;
          case 'Notification':
            onNotificationRef.current(frame.data);
            break;
          case 'llm':
            onLlmRef.current(frame.data);
            break;
          case 'error':
            onServerErrorRef.current(frame.message);
            break;
        }
      };
    };

    connect();

    return () => {
      if (ws?.readyState === WebSocket.OPEN) needsResync.current = true;
      stopped = true;
      window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [accessToken]);

  return status;
}
