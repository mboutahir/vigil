import type { Trace } from '../../api/tracesApi';
import { formatDuration, formatTime } from '../shared/utils/format';

interface Data {
  span: Trace;
  traceSpans: Trace[];
}

//atributes we will show 
const KEY_ATTRIBUTES = [
  'http.status_code',
  'http.response.status_code',
  'http.url',
  'url.full',
  'db.system',
  'db.statement',
  'rpc.method',
  'error.type',
  'exception.message',
];
//helper instead of each time rightting the two lines
function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-vigil-muted-extra text-[13px] break-all">
      {label}: <span className="text-vigil-text ms-1 text-[14px]">{value}</span>
    </p>
  );
}
//so we useing values is KEY_ATTRIBUTES as a key for the spans and if there is values then we want it if no t we dont
export default function TraceDetails({ span, traceSpans }: Data) {
  const attributes = KEY_ATTRIBUTES.filter((key) => span.attributes?.[key]).map(
    (key) => [key, span.attributes[key]],
  );
  //waterfall: timestamp is when a span started, so its bar starts at (start - trace start) and is as long as its duration
  //sort by start time so parents come before the calls they made, and the root first when they start at the same time
  const spans = [...traceSpans].sort(
    (a, b) =>
      Date.parse(a.timestamp) - Date.parse(b.timestamp) ||
      Number(Boolean(a.parent_span_id)) - Number(Boolean(b.parent_span_id)),
  );
  const traceStart = Math.min(...spans.map((s) => Date.parse(s.timestamp)));
  const traceEnd = Math.max(
    ...spans.map((s) => Date.parse(s.timestamp) + s.duration_ms),
  );
  //max 1 so we never divide by 0 when everything took 0ms
  const total = Math.max(1, traceEnd - traceStart);

  return (
    <div className="bg-vigil-bg px-3 py-4.5 space-y-4 mono">
      <div>
        <div className="uppercase mb-2 text-[12px] text-vigil-muted-extra tracking-wider">
          Span
        </div>
        <div className="flex flex-wrap gap-x-25 gap-y-2">
          <Field label="trace_id" value={span.trace_id} />
          <Field label="span_id" value={span.span_id} />
          <Field label="parent" value={span.parent_span_id || 'root span'} />
          <Field label="time" value={formatTime(span.timestamp)} />
        </div>
      </div>
      {attributes.length > 0 && (
        <div>
          <div className="uppercase mb-2 text-[12px] text-vigil-muted-extra tracking-wider">
            Attributes
          </div>
          <div className="flex flex-wrap gap-x-25 gap-y-2">
            {attributes.map(([key, value]) => (
              <Field key={key} label={key} value={value} />
            ))}
          </div>
        </div>
      )}
      {/* one bar per span of this trace, only the spans already loaded in the table */}
      {/* shown even with one span, then the request is just one full bar */}
      {spans.length > 0 && (
        <div>
          <div className="uppercase mb-2 text-[12px] text-vigil-muted-extra tracking-wider">
            {`Trace (${spans.length} span${spans.length === 1 ? '' : 's'} loaded)`}
          </div>
          <div className="space-y-1.5">
            {spans.map((s) => (
              <div key={s.span_id} className="flex items-center gap-3 text-[12px]">
                <span
                  title={s.name}
                  className="w-48 shrink-0 truncate text-vigil-muted"
                >
                  {s.name}
                </span>
                {/* the track is the whole trace, the bar is where this span ran inside it */}
                <div className="relative flex-1 h-3 bg-vigil-panel">
                  <div
                    //red for errors, blue for the root span (the whole request, no parent), grey for the calls inside it
                    className={`absolute inset-y-0 ${s.status === 'error' ? 'bg-vigil-critical' : !s.parent_span_id ? 'bg-vigil-accent' : 'bg-vigil-muted'}`}
                    style={{
                      left: `${((Date.parse(s.timestamp) - traceStart) / total) * 100}%`,
                      width: `${Math.max(1, (s.duration_ms / total) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-vigil-muted">
                  {formatDuration(s.duration_ms)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
