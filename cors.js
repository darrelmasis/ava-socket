const allowedOrigins = [
  'http://localhost:5173', // frontend Vite local
  'http://localhost:3000', // backend local (si haces peticiones internas)
  process.env.LOCAL_URL,
  process.env.VERCEL_URL,
  `https://${process.env.VERCEL_URL}`,
].filter(Boolean) // elimina undefined

const getCorsOrigin = (req) => {
  const origin = req?.headers?.origin
  if (allowedOrigins.includes(origin)) {
    return origin // devolver el mismo si está permitido
  }

  // fallback: primer dominio de la lista
  return allowedOrigins[0]
}

export const getCorsHeaders = (
  req,
  methods = 'GET, POST, PUT, DELETE, OPTIONS'
) => ({
  'Access-Control-Allow-Origin': getCorsOrigin(req),
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': methods,
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, x-role, x-username',
})
