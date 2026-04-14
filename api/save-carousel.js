const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { title, mode, renderMode, theme, slides, agent1Output, agent2Output } = req.body
  if (!title || !mode || !slides) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    const { data: record, error: dbError } = await supabase
      .from('carousels')
      .insert({
        title,
        mode,
        render_mode: renderMode || null,
        slide_count: slides.length,
        theme,
        slides,
        agent1_output: agent1Output || null,
        agent2_output: agent2Output || null,
        thumbnail_url: null,
        slide_urls: null
      })
      .select('id')
      .single()

    if (dbError) throw new Error(dbError.message)

    res.json({ ok: true, id: record.id })
  } catch (err) {
    console.error('save-carousel error:', err)
    res.status(500).json({ error: err.message || 'Error guardando el carrusel' })
  }
}
