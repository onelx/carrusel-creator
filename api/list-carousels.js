const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    const { data, error } = await supabase
      .from('carousels')
      .select('id, created_at, title, mode, render_mode, slide_count, thumbnail_url, rating')
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) throw new Error(error.message)

    res.json({ ok: true, carousels: data })
  } catch (err) {
    console.error('list-carousels error:', err)
    res.status(500).json({ error: err.message || 'Error cargando el historial' })
  }
}
