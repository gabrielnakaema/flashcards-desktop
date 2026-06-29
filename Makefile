-include .env
export LLM_API_KEY
export E2E_DB_PATH

.PHONY: e2e

e2e:
	python -m pytest e2e/ -v