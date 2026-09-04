export async function POST(request: Request) {
  try {
    const { message, image, subject, history } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { reply: 'Erro: A chave GEMINI_API_KEY não foi encontrada no .env.local' },
        { status: 500 }
      );
    }

    const MODEL_NAME = 'gemini-3.6-flash';

    const systemPrompts: Record<string, string> = {
      mat: 'És um tutor explicador de Matemática A do ensino secundário em Portugal. Explica os conceitos passo a passo e de forma clara.',
      pt: 'És um tutor explicador de Português do ensino secundário em Portugal. Ajuda em gramática, análise textual e obras literárias.',
      ei: 'És um tutor de Engenharia Informática. Ajuda com programação, algoritmos, estruturas de dados e conceitos de computação.',
    };

    const contents = (history || []).map((h: any) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    const currentParts: any[] = [];
    if (message) currentParts.push({ text: message });

    if (image && image.includes('base64,')) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
      currentParts.push({
        inline_data: { mime_type: mimeType, data: base64Data },
      });
    }

    contents.push({ role: 'user', parts: currentParts });

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompts[subject] || systemPrompts.mat }],
          },
          contents,
        }),
      }
    );

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return Response.json(
        { reply: `Erro Gemini (${apiResponse.status}): ${data.error?.message || 'Falha na requisição.'}` },
        { status: apiResponse.status }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta recebida.';
    return Response.json({ reply });

  } catch (error: any) {
    return Response.json(
      { reply: `Erro no servidor: ${error?.message || 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}