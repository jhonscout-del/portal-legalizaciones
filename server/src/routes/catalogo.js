import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import * as catalogoRepo from '../lib/repos/catalogo.js'

export const catalogoRouter = Router()

catalogoRouter.use(requireAuth)

// --- Unidades de Negocio ---

catalogoRouter.get('/business-units', async (req, res) => {
  res.json(await catalogoRepo.listBusinessUnits())
})

catalogoRouter.post('/business-units', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { code, name, donor, active } = req.body
  const unit = await catalogoRepo.createBusinessUnit({ code, name, donor, active: active ?? true })
  res.status(201).json(unit)
})

catalogoRouter.put('/business-units/:id', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { code, name, donor, active } = req.body
  const unit = await catalogoRepo.updateBusinessUnit(req.params.id, { code, name, donor, active })
  res.json(unit)
})

// --- Proyectos ---

catalogoRouter.get('/projects', async (req, res) => {
  res.json(await catalogoRepo.listProjects())
})

catalogoRouter.post('/projects', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { name, businessUnitId, encargado, active, responsableEmail } = req.body
  const project = await catalogoRepo.createProject({ name, businessUnitId, encargado, active: active ?? true, responsableEmail })
  res.status(201).json(project)
})

catalogoRouter.put('/projects/:id', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { name, businessUnitId, encargado, active, responsableEmail } = req.body
  const project = await catalogoRepo.updateProject(req.params.id, { name, businessUnitId, encargado, active, responsableEmail })
  res.json(project)
})

// --- Tabla de retención (solo lectura para el cliente) ---

catalogoRouter.get('/retention-rates', async (req, res) => {
  res.json(await catalogoRepo.listRetentionRates())
})
