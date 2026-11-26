from app.context import final_str
from app.schemas import AlertRule, ForwardRequest, AskRequest



ALERT_MESSAGE= """You are an on-call assistant for an observability platform.
You are given telemetry collected around the moment an alert fired.

Write 2 to 4 sentences for an engineer who just got paged:
1. what the telemetry shows
2. the most likely cause, if the telemetry supports one
3. what to check first

Rules:
- Use only the telemetry given. Never invent log lines, metric values or span names.
- Do not repeat the service name or the severity. The alert title already has them.
- If the telemetry does not show a cause, say so plainly and name what is missing.
- Plain prose. No markdown, no headings, no bullet points, no preamble.
- If no telemetry was recorded, reply exactly: Analysis unavailable. No telemetry was recorded in this window."""

ASK_MESSAGE = """You are an on-call assistant for an observability platform.
An engineer is asking a question about one alert. Below you get the alert rule, the telemetry
collected around the moment it fired, maybe an earlier automatic analysis, and maybe
earlier questions and answers about this alert.

Answer from that data in at most 5 sentences of plain prose, no markdown, no preamble.
Use only the data given. Never invent log lines, metric values, span names or timestamps.
You may suggest common fixes for the problem the data shows.
If the data cannot answer the question, say so plainly and name what is missing.
Do not repeat the earlier analysis unless the engineer asks for it.

Questions about the cause, a fix, what to check, or the logs, traces and metrics are always answered.
Questions about cooking, poems, jokes, sports or other topics outside software get only this reply:
I can only answer questions about this alert.

Examples:
Question: Suggest a fix
Answer: (a short fix based on the telemetry)
Question: what caused this?
Answer: (the cause the telemetry points to)
Question: write a poem about the sea
Answer: I can only answer questions about this alert.
Question: give me a cake recipe
Answer: I can only answer questions about this alert."""

#java marks a silence alert (the service stopped sending telemetry) with this metric name instead of a rule
SILENT_METRIC = "service_silent"

#for a silence alert the empty telemetry is the problem itself, not missing data, so the model gets its own instructions
SILENCE_MESSAGE = """You are an on-call assistant for an observability platform.
The service in this alert stopped sending telemetry: no logs, metrics or traces arrived for longer than the silence timeout.
The missing telemetry is the problem itself. It does not mean the analysis is impossible.

Answer in one short paragraph of 2 to 4 sentences, with no lists and no numbering. Say that the service stopped reporting, give the most likely causes (the service crashed or was stopped, its container is down, or its OpenTelemetry exporter can no longer reach Vigil because of a wrong endpoint, ingestion key or certificate, or a network problem), and say what to check first (whether the process or container is running and what its own logs say, then the exporter settings and the connection to Vigil).

Never say the analysis is unavailable, never ask for more telemetry, and never invent log lines, metric values or error messages.

Example answer:
The service stopped sending telemetry, so it has probably crashed, been stopped, or lost its connection to Vigil. Check first whether its process or container is still running and read its own logs. If it is running, check its OpenTelemetry exporter endpoint, ingestion key and certificate, and whether it can still reach Vigil."""

#added to the Ask AI prompt so the model does not answer that the data is missing
SILENCE_NOTE = ("This is a silence alert: the service stopped sending telemetry. "
                "Having no telemetry below is expected, the silence itself is the problem. "
                "Likely causes: the service crashed or was stopped, its container is down, "
                "or its OpenTelemetry exporter can no longer reach Vigil.")

def _is_silence(rule: AlertRule | None) -> bool:
    return rule is not None and rule.metric_name == SILENT_METRIC

#_rule_line translates the alert rule from JSON fields into one English sentence so the model knows what fired the alert.
def _rule_line(rule: AlertRule | None) -> str:
    if rule is None:
        return "rule: unknown"
    if _is_silence(rule) or rule.threshold is None:
        return "rule: the service went silent (no telemetry before the timeout)"
    # how many values in the window become one number: avg, max, min, sum, count, latest, p95
    #threshold = the limit the value reached
    what = rule.aggregation or "value"
    if rule.metric_name:
        what = f"{what}({rule.metric_name})"
    window = f" over {rule.window_seconds}s" if rule.window_seconds else ""
    severity = f" ({rule.severity})" if rule.severity else ""
    return (f"rule: {what} on {rule.signal_type or 'telemetry'}{window} "
            f"reached {rule.threshold:g} or more{severity}")


def alert_prompt(req: ForwardRequest) -> list[dict[str, str]]:
    if _is_silence(req.rule):
        content = (f"service: {req.service}\n{_rule_line(req.rule)}\n"
                   f"The alert fired at {req.triggered_at:%H:%M:%S} UTC.")
        #the window before a silence alert is normally empty, only add telemetry if some arrived anyway
        if req.context.logs or req.context.metrics or req.context.traces:
            content += f"\n\n{final_str(req.context, req.triggered_at)}"
        return [
            {"role": "system", "content": SILENCE_MESSAGE},
            {"role": "user", "content": content},
        ]
    return [
        {"role": "system", "content": ALERT_MESSAGE},
        {
            "role": "user",
            "content": f"service: {req.service}\n{_rule_line(req.rule)}\n\n{final_str(req.context, req.triggered_at)}",
        },
    ]
def ask_prompt(req: AskRequest) -> list[dict[str, str]]:
    analysis = f"Earlier analysis: {req.previous_analysis}\n\n" if req.previous_analysis else ""
    history = ""
    if req.history:
        turns = "\n\n".join(f"Question: {item.question}\nAnswer: {item.answer or ''}" for item in req.history)
        history = f"Previous questions and answers:\n{turns}\n\n"
    silence = f"{SILENCE_NOTE}\n" if _is_silence(req.rule) else ""
    return [
        {"role": "system", "content": ASK_MESSAGE},
        {
            "role": "user",
            "content": f"Question: {req.question}\n\nservice: {req.service}\n{_rule_line(req.rule)}\n{silence}\n{final_str(req.context, req.triggered_at)}\n\n{analysis}{history}Question again: {req.question}",
        },
    ]