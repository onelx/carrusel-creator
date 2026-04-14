const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id, rating, agent1Output, agent2Output } = req.body
  if (!id || !rating) return res.status(400).json({ error: 'id y rating son requeridos' })
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating debe ser entre 1 y 5' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    const update = { rating }
    if (agent1Output) update.agent1_output = agent1Output
    if (agent2Output) update.agent2_output = agent2Output

    const { error } = await supabase
      .from('carousels')
      .update(update)
      .eq('id', id)

    if (error) throw new Error(error.message)

    res.json({ ok: true })
  } catch (err) {
    console.error('rate-carousel error:', err)
    res.status(500).json({ error: err.message })
  }
}
