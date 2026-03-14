import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plant_species, scientific_name } = await req.json()

    if (!plant_species || !scientific_name) {
      return new Response(
        JSON.stringify({ error: 'plant_species and scientific_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate detailed care instructions for ${plant_species} (${scientific_name}). Respond with ONLY valid JSON in this exact format:
{
  "watering_frequency_days": 7,
  "light_requirement": "Bright indirect light",
  "fertilizer_schedule": "Monthly during growing season",
  "care_instructions": {
    "watering": "Water when the top inch of soil is dry",
    "humidity": "Prefers moderate to high humidity",
    "temperature": "65-80°F (18-27°C)",
    "soil": "Well-draining potting mix",
    "repotting": "Every 1-2 years in spring"
  },
  "common_problems": ["Overwatering", "Root rot", "Spider mites"]
}`,
        },
      ],
    })

    const contentBlock = response.content[0]
    if (!contentBlock || contentBlock.type !== 'text') {
      throw new Error('Unexpected response format from Claude')
    }
    const raw = contentBlock.text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
    const result = JSON.parse(raw)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
