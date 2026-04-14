const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id, slideUrls, thumbnailUrl } = req.body
  if (!id) return res.status(400).json({ error: 'id is required' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    const update = {}
    if (slideUrls?.length) update.slide_urls = slideUrls
    if (thumbnailUrl) update.thumbnail_url = thumbnailUrl

    const { error } = await supabase.from('carousels').update(update).eq('id', id)
    if (error) throw new Error(error.message)

    res.json({ ok: true })
  } catch (err) {
    console.error('confirm-carousel error:', err)
    res.status(500).json({ error: err.message })
  }
}
