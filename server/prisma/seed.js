import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const businessUnits = [
    { code: '009', name: 'CCCM', donor: 'CCCM', active: true },
    { code: '010', name: 'CCCM', donor: 'THE FEDERAL MINISTER FOR FOREIGN AFFAIRS', active: true },
    { code: '035', name: 'ALEMANIA 2024', donor: 'THE FEDERAL MINISTER FOR FOREIGN AFFAIRS', active: true },
    { code: '039', name: 'PNUD 2025', donor: 'PROGRAMA DE LAS NACIONES UNIDAS PARA EL DESARROLLO', active: true },
    { code: '040', name: 'COSUDE 2025', donor: 'AGENCIA DE COOPERACION SUIZA PARA EL DESARROLLO - COSUDE', active: true },
    { code: '041', name: 'NORAD 2026 - 2029', donor: 'AGENCIA NORUEGA DE COOPERACION PARA EL DESARROLLO - NORAD', active: true },
    { code: '042', name: 'DEPARTAMENTO DE ESTADO 2026 - 2027', donor: 'DEPARTAMENTO DE ESTADO DE ESTADOS UNIDOS', active: true },
  ]
  for (const bu of businessUnits) {
    await prisma.businessUnit.upsert({
      where: { code: bu.code },
      update: {},
      create: bu,
    })
  }

  const retentionRates = [
    { concepto: 'Hoteles y restaurantes', baseGravable: 100000, porcentaje: 0.035 },
    { concepto: 'Transporte terrestre pasajeros', baseGravable: 100000, porcentaje: 0.01 },
    { concepto: 'Transporte fluvial pasajeros', baseGravable: 100000, porcentaje: 0.01 },
    { concepto: 'Compras (responsables de IVA)', baseGravable: 498000, porcentaje: 0.025 },
    { concepto: 'Compras (no responsables de IVA)', baseGravable: 498000, porcentaje: 0.035 },
  ]
  for (const rate of retentionRates) {
    await prisma.retentionRate.upsert({
      where: { concepto: rate.concepto },
      update: {},
      create: rate,
    })
  }

  console.log('Seed completado: catálogo de unidades de negocio y tabla de retención.')
  console.log('Los usuarios se crean automáticamente al iniciar sesión con Microsoft.')
  console.log('Define BOOTSTRAP_ADMIN_EMAIL en server/.env con tu correo corporativo')
  console.log('para que tu primer login te asigne el rol ADMINISTRATIVO.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
