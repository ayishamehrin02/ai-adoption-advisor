import 'server-only';
import { intakeSchema } from '../../../lib/schema';
import { extractTasks, IntakeError } from '../../../lib/extract';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Requests must come from this app.' }, { status: 403 });
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'Expected JSON.' }, { status: 415 });
  // Bound streamed input too: Content-Length can be absent or forged.
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: 'A workflow is required.' }, { status: 400 });
  let bytes = 0;
  let raw = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 64000) { await reader.cancel(); return Response.json({ error: 'The workflow is too long.' }, { status: 413 }); }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const parsed = intakeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: 'Add a title, select a sector, and describe the workflow in 30–12,000 characters.' }, { status: 400 });
    const result = await extractTasks(parsed.data);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof IntakeError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return Response.json({ error: 'The request is not valid JSON.' }, { status: 400 });
    return Response.json({ error: 'Unable to process this workflow. Please try again.' }, { status: 500 });
  }
}
