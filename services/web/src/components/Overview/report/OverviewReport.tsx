import { Document, Image, Line, Page, Rect, Svg, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import vigilLogo from '../../../assets/images/vigil-logo-report.png?inline';
import type { AlertHistory } from '../../../api/alertHistoryApi';
import type { Log } from '../../../api/logsApi';
import type { Point } from '../RequestPerformance/RequestPerformance';
import type { Trace } from '../../../api/tracesApi';
import {
  describeAlert,
  formatRate,
  type LogFilter,
  type ServiceSummary,
  type TimeWindow,
} from '../overviewData';

interface Data {
  window: TimeWindow;
  service: string | null;
  alerts: AlertHistory[];
  services: ServiceSummary[];
  spans: Trace[];
  chartStart: number;
  chartData: Point[];
  logs: Log[];
  logFilter: LogFilter;
  logSearch: string;
  coverageNotes: string[];
}

const ink = '#212021';
const muted = '#665f58';
const accent = '#ff9830';
const styles = StyleSheet.create({
  page: { padding: 36, paddingBottom: 54, color: ink, fontSize: 10 },
  masthead: { backgroundColor: ink, padding: 18, borderLeftWidth: 5, borderLeftColor: accent },
  brand: { width: 96, height: 30 },
  title: { fontSize: 25, color: '#ffffff', marginTop: 6, marginBottom: 8 },
  scope: { color: '#fff2e3', fontSize: 10 },
  section: { fontFamily: 'Helvetica-Bold', fontSize: 15, marginTop: 18, marginBottom: 7 },
  note: { color: muted, fontSize: 9, lineHeight: 1.4, marginBottom: 4 },
  strip: { flexDirection: 'row', gap: 6, marginVertical: 12 },
  card: { flex: 1, backgroundColor: '#fff3e5', padding: 9 },
  number: { fontFamily: 'Helvetica-Bold', fontSize: 19, marginBottom: 3 },
  label: { fontSize: 8, color: muted },
  header: { flexDirection: 'row', backgroundColor: '#ffe7cb', padding: 6, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e1d8cf', padding: 6 },
  detail: { marginTop: 3, color: muted, fontSize: 9 },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#e1d8cf', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', color: muted, fontSize: 8 },
});

function stamp(value: number | string) {
  return new Date(value).toISOString().slice(0, 16).replace('T', ' ');
}

function Stat({ label, value, color = ink }: { label: string; value: number | string; color?: string }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.number, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const series = [
  { key: 'throughput', title: 'Throughput', unit: 'spans/min', color: accent },
  { key: 'errors', title: 'Error spans', unit: 'errors/min', color: '#b74534' },
  { key: 'latency', title: 'Mean duration', unit: 'ms', color: '#975215' },
] as const;

function PerformanceTrends({ points, start, end }: { points: Point[]; start: number; end: number }) {
  return (
    <View wrap={false}>
      <Text style={styles.section}>Performance trends</Text>
      <Text style={styles.note}>Each column covers one of {points.length} equal intervals. The scale beside each chart shows its peak.</Text>
      {series.map(({ key, title, unit, color }) => {
        const peak = Math.max(0, ...points.map((point) => point[key] ?? 0));
        const step = 360 / points.length;
        return (
          <View key={key} style={[styles.row, { alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text>{title}</Text>
              <Text style={styles.detail}>{Number(peak.toPrecision(3))} {unit}</Text>
            </View>
            <Svg width={360} height={36} viewBox="0 0 360 36">
              <Line x1={0} y1={35} x2={360} y2={35} stroke="#ded6ce" strokeWidth={1} />
              {points.map((point, i) => {
                const value = point[key];
                if (value === null) return null;
                const height = peak ? 33 * value / peak : 0;
                return <Rect key={point.ts} x={i * step + 1} y={35 - Math.max(height, 1)} width={step - 2} height={Math.max(height, 1)} fill={color} />;
              })}
            </Svg>
          </View>
        );
      })}
      <View style={{ marginLeft: 'auto', width: 372, paddingHorizontal: 6, flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
        <Text style={styles.label}>{stamp(start)} UTC</Text>
        <Text style={styles.label}>{stamp(end)} UTC</Text>
      </View>
    </View>
  );
}

export async function exportOverviewPdf(data: Data) {
  const { alerts, services, spans } = data;
  const critical = alerts.filter((alert) => alert.severity === 'critical').length;
  const warning = alerts.filter((alert) => alert.severity === 'warning').length;
  const unacknowledged = alerts.filter((alert) => alert.status === 'sent').length;
  const errors = spans.filter((span) => span.status === 'error').length;
  const durations = spans.map((span) => span.duration_ms).sort((a, b) => a - b);
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  const recent = [...alerts].sort((a, b) => Date.parse(b.triggered_at) - Date.parse(a.triggered_at)).slice(0, 8);
  const recentLogs = [...data.logs].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 6);
  const generated = stamp(Date.now());
  const report = (
    <Document title="Vigil | Dashboard overview" author="Vigil">
      <Page size="A4" style={styles.page}>
        <View style={styles.masthead}>
          <Image src={vigilLogo} style={styles.brand} />
          <Text style={styles.title}>Dashboard overview</Text>
          <Text style={styles.scope}>{data.service ?? 'All services'}   |   {data.window.label.replace('→', 'to')}</Text>
        </View>

        <View style={styles.strip} wrap={false}>
          <Stat label="Healthy / observed services" value={`${services.filter((s) => s.state === 'healthy').length} / ${services.length}`} color="#864300" />
          <Stat label="Critical alerts" value={critical} color={critical ? '#a33339' : ink} />
          <Stat label="Warning alerts" value={warning} />
          <Stat label="Unacknowledged alerts" value={unacknowledged} />
        </View>
        <Text style={styles.note}>Snapshot of loaded dashboard data. All times are UTC.</Text>
        {data.coverageNotes.map((note) => <Text key={note} style={styles.note}>{note}</Text>)}

        <Text style={styles.section} minPresenceAhead={45}>Span performance</Text>
        <Text style={styles.note}>{stamp(data.chartStart)} to {stamp(data.window.end)} UTC</Text>
        {spans.length ? (
          <View style={styles.strip} wrap={false}>
            <Stat label="Observed spans" value={spans.length} />
            <Stat label="Error spans" value={errors} />
            <Stat label="Span error rate" value={`${(100 * errors / spans.length).toFixed(1)}%`} />
            <Stat label="95th percentile duration" value={`${Number(p95.toFixed(1))} ms`} />
          </View>
        ) : <Text style={styles.note}>No spans in the loaded sample.</Text>}

        {spans.length > 0 && data.chartData.length > 0 && (
          <PerformanceTrends points={data.chartData} start={data.chartStart} end={data.window.end} />
        )}

        <Text style={styles.section} minPresenceAhead={45}>Recent alerts</Text>
        {recent.length ? (
          <>
            <Text style={styles.note}>Showing the latest {recent.length} of {alerts.length} loaded alerts.</Text>
            {recent.map((alert) => (
              <View key={alert.id} style={styles.row} wrap={false}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text>{alert.service}</Text>
                  <Text style={styles.detail}>{describeAlert(alert).replace('≥', '>=')}</Text>
                </View>
                <View style={{ width: 110 }}>
                  <Text>{alert.severity}</Text>
                  <Text style={styles.detail}>{alert.status === 'sent' ? 'Unacknowledged' : alert.status}</Text>
                </View>
                <Text style={{ width: 98 }}>{stamp(alert.triggered_at)}</Text>
              </View>
            ))}
          </>
        ) : <Text style={styles.note}>No alerts in the loaded history for this scope.</Text>}

        <Text style={styles.section} minPresenceAhead={45}>Service health</Text>
        {services.length ? (
          <>
            <View style={styles.header} minPresenceAhead={22}>
              <Text style={{ flex: 2 }}>Service</Text><Text style={{ flex: 1 }}>State</Text>
              <Text style={{ flex: 1 }}>Mean duration</Text><Text style={{ flex: 1 }}>Span rate</Text>
            </View>
            {services.map((s) => (
              <View key={s.name} style={styles.row} wrap={false}>
                <Text style={{ flex: 2, paddingRight: 6 }}>{s.name}</Text>
                <Text style={{ flex: 1 }}>{s.state}</Text>
                <Text style={{ flex: 1 }}>{s.latency === null ? '—' : `${Number(s.latency.toFixed(1))} ms`}</Text>
                <Text style={{ flex: 1 }}>{formatRate(s.rate)}</Text>
              </View>
            ))}
          </>
        ) : <Text style={styles.note}>No services observed in loaded alerts or spans.</Text>}

        <Text style={styles.section} minPresenceAhead={48}>Recent logs</Text>
        <Text style={styles.note}>
          {data.logFilter === 'issues' ? 'Warning, error and critical logs' : 'All log severities'}
          {data.logSearch && ` matching "${data.logSearch}"`}. Showing {recentLogs.length} of {data.logs.length} loaded entries.
        </Text>
        {recentLogs.map((log, index) => (
          <View key={index} wrap={false} style={[styles.row, { flexDirection: 'column' }]}>
            <Text>{stamp(log.timestamp)} UTC   |   {log.severity.toUpperCase()}   |   {log.service}</Text>
            <Text style={styles.detail}>{log.message.length > 280 ? log.message.slice(0, 279) + '…' : log.message}</Text>
          </View>
        ))}

        <View fixed style={styles.footer}>
          <Text>Vigil   /   Generated {generated} UTC</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(report).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vigil-overview-report.pdf';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
