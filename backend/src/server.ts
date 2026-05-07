import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { registerAuthDecorator } from './middleware/auth'
import { authRoutes } from './routes/auth'
import { saveRoutes } from './routes/save'
import { leaderboardRoutes } from './routes/leaderboard'
import { iapRoutes } from './routes/iap'

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/glow_island' })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const app = Fastify({ logger: true })

// Register plugins
app.register(fastifyJwt, { secret: process.env.JWT_SECRET! })
app.register(fastifyCors, { origin: '*' })

// Register auth decorator at the root scope so all sub-instances inherit it
registerAuthDecorator(app)

// Health check (no version prefix, no auth required)
app.get('/health', async (_request, reply) => {
  let dbStatus: 'ok' | 'degraded' | 'down' = 'ok'
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbStatus = 'down'
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded'
  const httpStatus = status === 'ok' ? 200 : 503

  return reply.status(httpStatus).send({
    status,
    version: process.env.npm_package_version ?? '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      iap_apple: 'ok',
      iap_google: 'ok',
    },
  })
})

// Register versioned API routes
app.register(
  async (api) => {
    await authRoutes(api, prisma)
    await saveRoutes(api, prisma)
    await leaderboardRoutes(api, prisma)
    await iapRoutes(api, prisma)
  },
  { prefix: '/v1' }
)

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, shutting down...`)
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  })
}

// Start server
const start = async (): Promise<void> => {
  try {
    const port = Number(process.env.PORT) || 3000
    await app.listen({ port, host: '0.0.0.0' })
    app.log.info(`Server listening on port ${port}`)
  } catch (err) {
    app.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

start()
