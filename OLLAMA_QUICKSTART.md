# Ollama Beta Setup

The beta uses Ollama only. Browser code never calls Ollama directly.

## Models

Install a small model for app chat and a model for final clinician recommendations:

```bash
ollama pull llama3.2
ollama pull llama3.1:8b
```

For machines with limited memory, use `llama3.2` for both roles.

## Portal configuration

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_FAST_MODEL=llama3.2
OLLAMA_FINAL_MODEL=llama3.1:8b
OLLAMA_FINAL_MAX_TOKENS=800
OLLAMA_KEEP_ALIVE=10m
OLLAMA_AVAILABILITY_TTL_MS=15000
```

`OLLAMA_FINAL_MODEL` is used only by the authenticated clinician recommendation
endpoint. Questionnaire previews are rendered from local form state and never
wait for a model response.

## Runtime flow

1. Start Ollama with `ollama serve`.
2. Start the portal with `npm run dev`.
3. Open a patient review and select **Generate with Ollama**.
4. The portal streams the recommendation over SSE and stores the completed
   recommendation in Supabase.
5. Reopening the patient review loads only the latest stored recommendation.

Ollama availability is cached briefly, and generation requests use `keep_alive`
to reduce repeated model startup time.

## Failure behavior

- Questionnaire previews and editing never wait for Ollama.
- If Ollama is offline, generation returns a 503 or SSE error event with the
  request ID available in the response headers.
- Partial output is not inserted into `recommendations`.
- Logs include model and request ID, never prompts, patient context, or output.

Run `npm test` to verify questionnaire reliability without starting Ollama.
