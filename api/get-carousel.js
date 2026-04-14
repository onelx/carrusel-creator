const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id is required' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    const { data: carousel, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    if (!carousel) return res.status(404).json({ error: 'Carrusel no encontrado' })

    // Construir las URLs públicas de cada slide desde Storage
    const slideUrls = []
    for (let i = 1; i <= carousel.slide_count; i++) {
      const path = `${id}/slide-${String(i).padStart(2, '0')}.png`
      const { data } = supabase.storage.from('carousel-slides').getPublicUrl(path)
      slideUrls.push(data.publicUrl)
    }

    res.json({ ok: true, carousel, slideUrls })
  } catch (err) {
    console.error('get-carousel error:', err)
    res.status(500).json({ error: err.message || 'Error cargando el carrusel' })
  }
}
