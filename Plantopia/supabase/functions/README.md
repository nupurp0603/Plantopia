# Plantopia — Edge Functions

Three Deno/TypeScript edge functions power the AI features via the Anthropic API.

## Functions

| Function | Method | Description |
|---|---|---|
| `identify-plant` | POST | Identifies a plant from an image URL using Claude Vision |
| `botanist-chat` | POST | Conversational plant care Q&A powered by Claude Opus |
| `generate-care` | POST | Generates detailed care instructions for a plant species |

## Required Secrets

Set in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

| Secret | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com) |

Or via CLI:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

## Deploying

```bash
supabase functions deploy identify-plant
supabase functions deploy botanist-chat
supabase functions deploy generate-care
```

## Local Testing

```bash
supabase functions serve --env-file .env.local
```

`.env.local`:
```
ANTHROPIC_API_KEY=your_key_here
```

Test identify-plant:
```bash
curl -i -X POST http://localhost:54321/functions/v1/identify-plant \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Sunflower_from_Silesia2.jpg/800px-Sunflower_from_Silesia2.jpg"}'
```

Test botanist-chat:
```bash
curl -i -X POST http://localhost:54321/functions/v1/botanist-chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"plant_context":{"plant_name":"Monstera","scientific_name":"Monstera deliciosa","care_instructions":{}},"user_message":"Why are my leaves turning yellow?","conversation_history":[]}'
```
