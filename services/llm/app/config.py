#importing env variables, converting them to their actual data type
#file purpose turn environment variables (always strings) into a typed, immutable settings object that every other file imports.
#BaseModel: declare fields with types, and you get a constructor that converts and validates. BaseSettings: the same, but the values come from env vars.
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file = ".env",
        env_file_encoding = "utf-8",
        extra = "ignore",
        #a pydantic model is mutable, so code could reassign a setting by mistake and lose the initial config; frozen makes that impossible
        frozen=True,
    )
    #these values are only used when an env var is missing; BaseSettings, which we inherit from, fills the fields from the env
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:0.5b"
    #How much text the model can read at once (question + answer together)
    ollama_num_ctx: int = 4000
    #Max length of the answer
    ollama_num_predict: int = 200
    #How “creative” the model is. Low = sticks to facts, high = makes stuff up
    ollama_temperature: float = 0.3
    #How many CPU cores Ollama uses
    ollama_num_thread: int = 4
    #max time for an answer
    llm_timeout_seconds: int = 25
    #max log lines put in the prompt
    max_context_logs: int = 20
    #max metrics in the prompt
    max_context_metrics: int = 10
    #max spans in the prompt
    max_context_traces: int = 10
    #max Ask AI questions per user
    llm_ask_limit: int = 5
    #length of that window in seconds
    llm_ask_window_seconds: int = 60
    #how many answers Ollama generates at the same time
    llm_max_concurrent: int = 1
    #how much time to wait for the lock
    llm_queue_wait_seconds: float = 0.5

settings = Settings()
