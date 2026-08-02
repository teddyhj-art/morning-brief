// Gemini 버전 서버리스 함수.
// index.html은 /api/claude 를 부르므로 파일 경로와 이름은 그대로 두세요.
// 응답 형식도 기존과 똑같이 { content: [{ type:"text", text:"..." }] } 로 맞춰뒀습니다.

const MODEL = "gemini-3.5-flash";

// 요청 종류별 출력 상한. 검색 결과를 읽고 정리해야 하므로 넉넉하게 둡니다.
const BUDGET = { list: 4000, detail: 5000, market: 2500 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "POST만 받습니다." } });
  }

  // 선택 사항: APP_PASSCODE를 등록해두면 ?k=값 이 붙은 주소로만 열립니다.
  const gate = process.env.APP_PASSCODE;
  if (gate && req.headers["x-app-key"] !== gate) {
    return res.status(401).json({ error: { message: "접근 코드가 맞지 않습니다. 주소 끝의 ?k= 값을 확인하세요." } });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: { message: "GEMINI_API_KEY 환경변수가 없습니다." } });
  }

  const { prompt, kind } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: { message: "prompt가 비어 있습니다." } });
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ error: { message: "prompt가 너무 깁니다." } });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: BUDGET[kind] || BUDGET.list,
        },
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const msg = (data && data.error && data.error.message) || `Gemini 응답 ${upstream.status}`;
      return res.status(upstream.status).json({ error: { message: msg } });
    }

    const cand = data.candidates && data.candidates[0];
    const parts = (cand && cand.content && cand.content.parts) || [];
    const text = parts.map((p) => p.text || "").join("").trim();

    if (!text) {
      const why = (cand && cand.finishReason) || "빈 응답";
      return res.status(502).json({ error: { message: `Gemini가 내용을 돌려주지 않았습니다 (${why}).` } });
    }

    // 프론트엔드가 기대하는 모양으로 감싸서 보냅니다.
    return res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    return res.status(502).json({ error: { message: "Gemini에 연결하지 못했습니다: " + err.message } });
  }
}
