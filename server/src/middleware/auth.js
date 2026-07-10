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
    const userRoles = req.session.user.roles || []
    if (!roles.some((r) => userRoles.includes(r))) {
      return res.status(403).json({ error: 'No autorizado para esta acción' })
    }
    next()
  }
}
