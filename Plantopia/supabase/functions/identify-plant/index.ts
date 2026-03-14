import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image_url } = await req.json()

    if (!image_url) {
      return new Response(JSON.stringify({ error: 'image_url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const imageResponse = await fetch(image_url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }
    const imageBuffer = await imageResponse.arrayBuffer()
    const bytes = new Uint8Array(imageBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64Image = btoa(binary)

    // Detect media type from response headers
    const contentType = imageResponse.headers.get('content-type') ?? 'image/jpeg'
    const mediaType = contentType.startsWith('image/') ? contentType.split(';')[0] : 'image/jpeg'

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64Image },
            },
            {
              type: 'text',
              text: `Identify this plant and provide care instructions. Respond with ONLY valid JSON in this exact format:
{
  "plant_name": "Common Name",
  "scientific_name": "Genus species",
  "confidence": 0.95,
  "description": "Brief description of this plant",
  "watering_frequency_days": 7,
  "light_requirement": "Bright indirect light",
  "fertilizer_schedule": "Monthly during growing season",
  "common_problems": ["Overwatering", "Root rot", "Spider mites"]
}`,
            },
          ],
        },
      ],
    })

    const raw = response.content[0].text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const result = JSON.parse(raw)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
