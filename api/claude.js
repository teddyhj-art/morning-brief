// 브라우저 대신 이 함수가 Anthropic API를 호출합니다.
// API 키는 Vercel 환경변수에만 있고, 클라이언트로 절대 내려가지 않습니다.

const MODEL = "claude-sonnet-5";

// 요청 종류별 토큰 상한 — 클라이언트가 마음대로 키울 수 없게 서버에서 고정합니다.
const BUDGET = { list: 1500, detail: 2000, market: 800 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "POST만 받습니다." } });
  }

  // 선택 사항: Vercel에 APP_PASSCODE를 등록해두면 ?k=값 이 있는 주소로만 열립니다.
  const gate = process.env.APP_PASSCODE;
  if (gate && req.headers["x-app-key"] !== gate) {
    return res.status(401).json({ error: { message: "접근 코드가 맞지 않습니다. 주소 끝의 ?k= 값을 확인하세요." } });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY 환경변수가 없습니다." } });
  }

  const { prompt, kind } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: { message: "prompt가 비어 있습니다." } });
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ error: { message: "prompt가 너무 깁니다." } });
  }

  const max_tokens = BUDGET[kind] || BUDGET.list;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens,
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const msg = (data && data.error && data.error.message) || `Anthropic 응답 ${upstream.status}`;
      return res.status(upstream.status).json({ error: { message: msg } });
    }

    // 텍스트 블록만 돌려줍니다. 검색 결과 원본은 내려보내지 않습니다.
    const content = (data.content || []).filter((b) => b.type === "text");
    return res.status(200).json({ content });
  } catch (err) {
    return res.status(502).json({ error: { message: "Anthropic에 연결하지 못했습니다: " + err.message } });
  }
}
