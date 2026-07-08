export function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autenticado' })
  }
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'No autenticado' })
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'No autorizado para esta acción' })
    }
    next()
  }
}
