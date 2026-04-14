const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { carouselId, index, imageB64, isPng } = req.body
  if (!carouselId || index === undefined || !imageB64) {
    return res.status(400).json({ error: 'Faltan campos: carouselId, index, imageB64' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    const buf = Buffer.from(imageB64, 'base64')
    const ext = isPng ? 'png' : 'jpg'
    const contentType = isPng ? 'image/png' : 'image/jpeg'
    const path = `${carouselId}/slide-${String(index + 1).padStart(2, '0')}.${ext}`

    const { error: upError } = await supabase.storage
      .from('carousel-slides')
      .upload(path, buf, { contentType, upsert: true })

    if (upError) throw new Error(upError.message)

    // Construir el URL manualmente para evitar bug del cliente Supabase
    // que a veces genera /public/sign/bucket en lugar de /public/bucket
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/carousel-slides/${path}`

    res.json({ ok: true, index, url: publicUrl })
  } catch (err) {
    console.error('upload-slide error:', err)
    res.status(500).json({ error: err.message || 'Error subiendo el slide' })
  }
}
