const http = require('http')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Load env vars from .env if present
try {
  const env = fs.readFileSync('.env', 'utf8')
  env.split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  })
} catch {}

const PORT = process.env.PORT || 5175

const mime = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  // API routes
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.replace('/api/', '').replace(/\/$/, '')
    const handlerPath = path.join(__dirname, 'api', `${name}.js`)
    if (!fs.existsSync(handlerPath)) {
      res.writeHead(404); res.end('API not found'); return
    }
    // Parse body
    let body = ''
    req.on('data', d => { body += d })
    req.on('end', async () => {
      req.body = body ? JSON.parse(body) : {}
      // Mock res
      const mockRes = {
        _status: 200, _headers: {}, _body: null,
        setHeader(k, v) { this._headers[k] = v },
        status(s) { this._status = s; return this },
        end(d) {
          res.writeHead(this._status, { 'Content-Type': 'text/plain', ...this._headers })
          res.end(d || '')
        },
        json(d) {
          res.writeHead(this._status, { 'Content-Type': 'application/json', ...this._headers })
          res.end(JSON.stringify(d))
        }
      }
      delete require.cache[require.resolve(handlerPath)]
      const handler = require(handlerPath)
      await handler(req, mockRes)
    })
    return
  }

  // Static files
  let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname)
  if (!fs.existsSync(filePath)) filePath = path.join(__dirname, 'index.html')
  const ext = path.extname(filePath)
  res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' })
  fs.createReadStream(filePath).pipe(res)
})

server.listen(PORT, () => console.log(`Carrusel Creator corriendo en http://localhost:${PORT}`))
