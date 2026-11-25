from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
#java sends JSON text FastAPI parses it into a dict pydantic checks and converts the dict into these classes, and only if that works does the endpoint code run.
#basemodel is a class we inherit from for validation we dont use a constructor and we specify the fields that we are filling in the class

class TelemetryRow(BaseModel):
    #model_config just to configure the base model: without it we get the default, with it we can say that extra fields we didnt expect are ignored
    model_config = ConfigDict(extra = "ignore")

class LogRow(TelemetryRow):
    service: str
    timestamp: datetime
    severity: str
    message: str
    #Field is a way to attach more rules to the field for example message: str = Field(min_length = 1) the string should have a minimum length of 1
    #we use default_factory = dict so that each instance gets its own separate dict
    attributes: dict[str, str] = Field(default_factory=dict)

class MetricsRow(TelemetryRow):
    service: str
    timestamp: datetime
    name: str
    value: float | None = None
    attributes: dict[str, str] = Field(default_factory=dict)

class TracesRow(TelemetryRow):
    trace_id: str
    span_id: str
    parent_span_id: str | None = None
    name: str
    service: str
    timestamp: datetime
    duration_ms: float
    status: str
    attributes: dict[str, str] = Field(default_factory=dict)

class AlertsContext(TelemetryRow):
    logs: list[LogRow] = Field(default_factory=list)
    metrics: list[MetricsRow] = Field(default_factory=list)
    traces: list[TracesRow] = Field(default_factory=list)



class AlertRule(TelemetryRow):
    signal_type: str | None = None
    metric_name: str | None = None
    aggregation: str | None = None
    threshold: float | None = None
    window_seconds: int | None = None
    severity: str | None = None

#for POST /internal/llm/forward
class ForwardRequest(TelemetryRow):
    alert_id: UUID
    service: str
    triggered_at: datetime
    rule: AlertRule | None =None
    context: AlertsContext = Field(default_factory=AlertsContext)

class HistoryItem(BaseModel):
    question: str
    answer: str | None = None


class AskRequest(ForwardRequest):
    model_config = ConfigDict(extra = "forbid", str_strip_whitespace = True)
    question: str = Field(min_length = 1, max_length = 500)
    previous_analysis: str | None = Field(default = None, max_length = 5000)
    history: list[HistoryItem] = Field(default_factory=list)
