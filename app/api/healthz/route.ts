export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "careerforge-ai",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
}
