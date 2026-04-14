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

  const { title, mode, renderMode, theme, slides, thumbnailB64, agent1Output, agent2Output } = req.body
  if (!title || !mode || !slides) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const supabase = getSupabase()

  try {
    // 1. Crear el registro en la tabla
    const { data: record, error: dbError } = await supabase
      .from('carousels')
      .insert({
        title,
        mode,
        render_mode: renderMode || null,
        slide_count: slides.length,
        theme,
        slides,
        thumbnail_url: null,
        agent1_output: agent1Output || null,
        agent2_output: agent2Output || null
      })
      .select('id')
      .single()

    if (dbError) throw new Error(dbError.message)
    const carouselId = record.id

    // 2. Subir el thumbnail si viene (es solo 1 imagen pequeña)
    let thumbnailUrl = null
    if (thumbnailB64) {
      const buf = Buffer.from(thumbnailB64, 'base64')
      const path = `${carouselId}/thumb.jpg`
      const { error: upError } = await supabase.storage
        .from('carousel-slides')
        .upload(path, buf, { contentType: 'image/jpeg', upsert: true })

      if (!upError) {
        const { data: urlData } = supabase.storage.from('carousel-slides').getPublicUrl(path)
        thumbnailUrl = urlData.publicUrl
        await supabase.from('carousels').update({ thumbnail_url: thumbnailUrl }).eq('id', carouselId)
      }
    }

    // 3. Generar URLs firmadas para que el cliente suba los slides directo
    const signedUrls = []
    for (let i = 0; i < slides.length; i++) {
      const path = `${carouselId}/slide-${String(i + 1).padStart(2, '0')}.jpg`
      const { data, error } = await supabase.storage
        .from('carousel-slides')
        .createSignedUploadUrl(path)
      if (!error && data) {
        signedUrls.push({ index: i, signedUrl: data.signedUrl, path, token: data.token })
      }
    }

    res.json({ ok: true, id: carouselId, thumbnailUrl, signedUrls })
  } catch (err) {
    console.error('save-carousel error:', err)
    res.status(500).json({ error: err.message || 'Error guardando el carrusel' })
  }
}
