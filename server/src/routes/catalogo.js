import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const catalogoRouter = Router()

catalogoRouter.use(requireAuth)

// --- Unidades de Negocio ---

catalogoRouter.get('/business-units', async (req, res) => {
  const units = await prisma.businessUnit.findMany({ orderBy: { code: 'asc' } })
  res.json(units)
})

catalogoRouter.post('/business-units', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { code, name, donor, active } = req.body
  const unit = await prisma.businessUnit.create({
    data: { code, name, donor, active: active ?? true },
  })
  res.status(201).json(unit)
})

catalogoRouter.put('/business-units/:id', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { code, name, donor, active } = req.body
  const unit = await prisma.businessUnit.update({
    where: { id: Number(req.params.id) },
    data: { code, name, donor, active },
  })
  res.json(unit)
})

// --- Proyectos ---

catalogoRouter.get('/projects', async (req, res) => {
  const projects = await prisma.project.findMany({
    include: { businessUnit: true },
    orderBy: { name: 'asc' },
  })
  res.json(projects)
})

catalogoRouter.post('/projects', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { name, businessUnitId, encargado, active } = req.body
  const project = await prisma.project.create({
    data: { name, businessUnitId: Number(businessUnitId), encargado, active: active ?? true },
    include: { businessUnit: true },
  })
  res.status(201).json(project)
})

catalogoRouter.put('/projects/:id', requireRole('ADMINISTRATIVO'), async (req, res) => {
  const { name, businessUnitId, encargado, active } = req.body
  const project = await prisma.project.update({
    where: { id: Number(req.params.id) },
    data: { name, businessUnitId: Number(businessUnitId), encargado, active },
    include: { businessUnit: true },
  })
  res.json(project)
})

// --- Tabla de retención (solo lectura para el cliente) ---

catalogoRouter.get('/retention-rates', async (req, res) => {
  const rates = await prisma.retentionRate.findMany()
  res.json(rates)
})
