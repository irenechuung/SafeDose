const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

export type MedIdentification = {
  name: string;
  dosage: string;
  instructions: string;
};

export async function identifyMedication(
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<MedIdentification> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64Image },
            },
            {
              type: 'text',
              text: 'Identify this medication from the photo. Return ONLY valid JSON with these exact keys: {"name": "medication name", "dosage": "strength like 10mg", "instructions": "brief instructions like Take with food"}. No other text.',
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse medication from image response.');
  return JSON.parse(match[0]) as MedIdentification;
}
