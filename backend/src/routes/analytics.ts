import type { FastifyInstance } from 'fastify'

interface AnalyticsEvent {
  event_name: string
  timestamp?: string
  properties?: Record<string, unknown>
}

interface CrashReport {
  message: string
  stack?: string
  timestamp?: string
  player_id?: string
  platform?: string
  build?: string
}

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  // Batch event ingestion — fire-and-forget, always returns 200
  app.post<{ Body: { events?: AnalyticsEvent[] } }>('/analytics/events', async (_request, reply) => {
    return reply.status(200).send({ ok: true })
  })

  // Crash report ingestion — fire-and-forget, always returns 200
  app.post<{ Body: CrashReport }>('/analytics/crashes', async (_request, reply) => {
    return reply.status(200).send({ ok: true })
  })
}
