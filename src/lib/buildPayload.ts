// Convert the flat answers map into a clearly-labeled, nested JSON payload for the webhook.

type Answers = Record<string, unknown>;

function set(obj: Record<string, any>, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

export function buildPayload(answers: Answers) {
  const payload: Record<string, any> = {
    submitted_at: new Date().toISOString(),
    source: "kavak-service-report-platform",
  };
  for (const [key, value] of Object.entries(answers)) {
    set(payload, key, value);
  }
  return payload;
}
