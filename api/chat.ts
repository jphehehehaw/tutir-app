export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Método não permitido' });
  }

  try {
    const { message, subject, history, image } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ reply: 'Erro: A chave GEMINI_API_KEY não foi configurada.' });
    }

    let systemInstruction = "És um tutor académico rigoroso, direto, prestável e encorajador. Responde SEMPRE em Português de Portugal. Usa formatação Markdown clara (com negrito, listas e blocos de código quando apropriado). Responde diretamente à dúvida do aluno sem comentar as tuas instruções internas.";

    if (subject === 'mat') {
      systemInstruction += " Especialista em Matemática A (12.º ano e exames nacionais em Portugal). Explica os conceitos passo a passo e SEMPRE que apresentares expressões matemáticas, fórmulas, limites, derivadas ou frações, utiliza notação LaTeX delimitada por $ para fórmulas inline (ex: $f(x) = x^2$) e $$ para fórmulas em bloco.";
    } else if (subject === 'pt') {
      systemInstruction += " Especialista em Português (12.º ano e exames nacionais em Portugal). Ajuda com gramática, interpretação de texto e obras literárias.";
    } else if (subject === 'ei') {
      systemInstruction += " Especialista em Engenharia Informática e Programação (C, C++, Java, Python, Estruturas de Dados, Algoritmos e SQL). Fornece explicações claras e formata sempre o código em blocos Markdown (```c, ```python, etc.).";
    }

    const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      const validHistory = history.filter((msg: any) => msg.text && (msg.sender === 'user' || msg.sender === 'ai'));
      
      for (const msg of validHistory) {
        const role: 'user' | 'model' = msg.sender === 'user' ? 'user' : 'model';
        contents.push({
          role: role,
          parts: [{ text: msg.text }]
        });
      }

      if (contents.length > 0 && contents[contents.length - 1].role === 'model') {
        contents.pop();
      }
    }

    const currentParts: Array<any> = [];

    if (message) {
      currentParts.push({ text: message });
    }

    if (image && typeof image === 'string' && image.startsWith('data:')) {
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        currentParts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });

        if (!message) {
          currentParts.push({ text: "Analisa esta imagem e ajuda-me com o que nela consta." });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    // Atualizado para o modelo gemini-3.6-flash pedido pela API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.3
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        reply: `Erro da API Gemini (${data.error?.code || response.status}): ${data.error?.message || 'Erro de comunicação.'}` 
      });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar resposta.';

    return res.status(200).json({ reply: replyText });
  } catch (error: any) {
    return res.status(500).json({ reply: `Erro interno no servidor: ${error?.message || 'Falha de ligação.'}` });
  }
}