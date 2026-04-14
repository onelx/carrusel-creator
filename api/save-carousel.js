const { createClient } = require('@supabase/supabase-js')

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { title, mode, renderMode, theme, slides, slideImages } = req.body
  if (!title || !mode || !slides || !slideImages?.length) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const supabase = getSupabase()

  try {
    // 1. Crear el registro en la tabla (sin thumbnail todavía)
    const { data: record, error: dbError } = await supabase
      .from('carousels')
      .insert({
        title,
        mode,
        render_mode: renderMode || null,
        slide_count: slides.length,
        theme,
        slides,
        thumbnail_url: null
      })
      .select('id')
      .single()

    if (dbError) throw new Error(dbError.message)
    const carouselId = record.id

    // 2. Subir cada slide a Supabase Storage
    const uploadedUrls = []
    for (let i = 0; i < slideImages.length; i++) {
      const buf = Buffer.from(slideImages[i], 'base64')
      const path = `${carouselId}/slide-${String(i + 1).padStart(2, '0')}.png`

      const { error: upError } = await supabase.storage
        .from('carousel-slides')
        .upload(path, buf, { contentType: 'image/png', upsert: true })

      if (upError) throw new Error(`Storage upload error: ${upError.message}`)

      const { data: urlData } = supabase.storage
        .from('carousel-slides')
        .getPublicUrl(path)

      uploadedUrls.push(urlData.publicUrl)
    }

    // 3. Actualizar thumbnail_url con la URL del primer slide
    await supabase
      .from('carousels')
      .update({ thumbnail_url: uploadedUrls[0] })
      .eq('id', carouselId)

    res.json({
      ok: true,
      id: carouselId,
      slideUrls: uploadedUrls,
      thumbnailUrl: uploadedUrls[0]
    })
  } catch (err) {
    console.error('save-carousel error:', err)
    res.status(500).json({ error: err.message || 'Error guardando el carrusel' })
  }
}
