# Legacy backend (deprecated)

This FastAPI backend is deprecated. The active backend is implemented as SvelteKit server routes in `app/`.

## Install

`poetry shell`

`poetry install`

# Optional: mock LLM responses (no API key needed)

`export MOCK_LLM=1`

# Run

`uvicorn src:app --reload`

# API Docs

After running on localhost:8000, go to:

Swagger style:

[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

or

Redoc style:

`[http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)


# Tests

`pytest -vv -s`
