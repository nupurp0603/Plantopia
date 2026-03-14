import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plant_context, user_message, conversation_history, user_profile } = await req.json()

    if (!plant_context || !user_message) {
      return new Response(
        JSON.stringify({ error: 'plant_context and user_message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    })

    // Tailor tone/complexity based on onboarding profile
    const experienceMap: Record<string, string> = {
      beginner: 'a complete beginner — use simple language, avoid jargon, and give step-by-step guidance',
      some:     'someone with some plant experience — be practical and skip very basic explanations',
      parent:   'an experienced plant parent — be detailed and use proper botanical terms when helpful',
      expert:   'an expert gardener — be technical, thorough, and treat them as a peer',
    }
    const experienceNote = user_profile?.experience
      ? `The user is ${experienceMap[user_profile.experience] ?? 'a plant enthusiast'}.`
      : ''
    const goalsNote = user_profile?.goals?.length
      ? `Their main goals are: ${user_profile.goals.join(', ')}.`
      : ''

    const plantNote = plant_context.plant_name && plant_context.plant_name !== 'General'
      ? `You are currently helping with a ${plant_context.plant_name} (${plant_context.scientific_name}). Care context: ${JSON.stringify(plant_context.care_instructions)}.`
      : 'Answer general plant care questions.'

    const systemPrompt = `You are an expert botanist and plant care advisor named Sage. ${plantNote} ${experienceNote} ${goalsNote} Be helpful, concise, and practical. If unsure, say so.`.trim()

    const history = Array.isArray(conversation_history) ? conversation_history : []

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...history.map((m: { role: 'user' | 'assistant'; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: user_message },
      ],
    })

    const assistant_message = response.content[0].text

    return new Response(JSON.stringify({ assistant_message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
