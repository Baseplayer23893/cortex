import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  title?: string
  content: string
  source?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cortex-api-key',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookSecret = Deno.env.get('CORTEX_WEBHOOK_SECRET')
    const cortexApiKey = req.headers.get('X-Cortex-API-Key')

    if (webhookSecret) {
      if (!cortexApiKey) {
        return new Response(
          JSON.stringify({ error: 'Missing required header: X-Cortex-API-Key' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      if (cortexApiKey !== webhookSecret) {
        return new Response(
          JSON.stringify({ error: 'Invalid X-Cortex-API-Key. Check your CORTEX_WEBHOOK_SECRET.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
    }

    let body: RequestBody = {}
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { title, content, source } = body

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Single client with service role - handles both DB writes and JWT verification
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          // Allow JWT verification to work with service role client
          Authorization: req.headers.get('Authorization') || '',
        },
      },
    })

    // Extract user ID from JWT (if present)
    let userId: string | null = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      try {
        // Use Promise.race for timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        })
        const authPromise = supabase.auth.getUser(token)
        const { data: { user }, error: authError } = await Promise.race([authPromise, timeoutPromise])
        if (!authError && user) {
          userId = user.id
        }
      } catch (e) {
        console.error('Auth error:', e)
      }
    }

    // Validate content length (max 1MB)
    const MAX_CONTENT_SIZE = 1024 * 1024
    if (content.length > MAX_CONTENT_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Content exceeds maximum size of 1MB' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Preserve title as heading if present
    const noteContent = title ? `## ${title}\n\n${content}` : content

    const noteData = {
      content: noteContent,
      created_at: new Date().toISOString(),
      status: 'inbox',
      source: source || 'cli',
      user_id: userId,
    }

    const { data, error } = await supabase
      .from('notes')
      .insert(noteData)
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      return new Response(
        JSON.stringify({ error: 'Database operation failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})