export async function POST(request: Request) {
  try {
    const { disciplina, materia, nivel, enunciado, base64Data } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY is not defined on the server.' }, { status: 500 });
    }

    const promptText = `Analisa a resolução apresentada na imagem para o exercício de ${disciplina} -> Tópico: ${materia} (${nivel}):
Enunciado: "${enunciado}".

Responde EXCLUSIVAMENTE num objeto JSON válido com a seguinte estrutura:
{
  "status": "correto" | "parcial" | "incorreto",
  "mensagem": "Explicação objetiva em português. Se estiver parcialmente correto, indica exatamente o que está certo, onde errou ou o que faltou completar."
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey.trim()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
            ],
          },
        ],
        generationConfig: { response_mime_type: 'application/json' },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || `Erro HTTP ${response.status}`);
    }

    const rawText = data.candidates[0].content.parts[0].text;
    const conteudo = JSON.parse(rawText);

    const status = conteudo.status || (conteudo.correto ? 'correto' : 'incorreto');

    return Response.json({
      status,
      mensagem: conteudo.mensagem,
    });
  } catch (error: any) {
    console.error('Erro na API de verificação:', error);
    return Response.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}