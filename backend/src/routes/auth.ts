import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

interface AnonymousBody {
  device_id: string
  platform: string
  client_version?: string
}

const VALID_PLATFORMS = ['ios', 'android', 'taptap']

export async function authRoutes(app: FastifyInstance, prisma: PrismaClient): Promise<void> {
  // POST /auth/anonymous
  app.post(
    '/auth/anonymous',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as AnonymousBody

      if (!body || !body.device_id) {
        return reply.status(400).send({
          error: { code: 'MISSING_DEVICE_ID', message: 'device_id is required' },
        })
      }

      if (!body.platform || !VALID_PLATFORMS.includes(body.platform)) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_PLATFORM',
            message: `platform must be one of: ${VALID_PLATFORMS.join(', ')}`,
          },
        })
      }

      const deviceId = body.device_id.trim()
      if (deviceId.length === 0 || deviceId.length > 128) {
        return reply.status(400).send({
          error: { code: 'INVALID_DEVICE_ID', message: 'device_id must be 1-128 characters' },
        })
      }

      // Find existing player
      let player = await prisma.player.findUnique({
        where: { deviceId },
        include: { save: true },
      })

      let isNew = false

      if (!player) {
        isNew = true
        // Create player + default save in a transaction
        player = await prisma.$transaction(async (tx) => {
          const newPlayer = await tx.player.create({
            data: {
              deviceId,
              platform: body.platform,
            },
            include: { save: true },
          })

          await tx.playerSave.create({
            data: {
              playerId: newPlayer.id,
              // All other fields use DB defaults
            },
          })

          return tx.player.findUnique({
            where: { id: newPlayer.id },
            include: { save: true },
          }) as Promise<NonNullable<typeof newPlayer>>
        })
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const token = app.jwt.sign(
        {
          player_id: player.id,
          device_id: player.deviceId,
          platform: player.platform,
        },
        { expiresIn: '7d' }
      )

      const statusCode = isNew ? 201 : 200

      const responseBody: Record<string, unknown> = {
        token,
        player_id: player.id,
        is_new_player: isNew,
        expires_at: expiresAt.toISOString(),
      }

      if (isNew && player.save) {
        const currency = player.save.currency as { beach_coins?: number; glowstone?: number }
        responseBody.initial_save = {
          beach_coins: currency?.beach_coins ?? 200,
          glowstone: currency?.glowstone ?? 0,
        }
      }

      return reply.status(statusCode).send(responseBody)
    }
  )

  // POST /auth/refresh
  app.post(
    '/auth/refresh',
    { preHandler: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = request.jwtPayload

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const token = app.jwt.sign(
        {
          player_id: payload.player_id,
          device_id: payload.device_id,
          platform: payload.platform,
        },
        { expiresIn: '7d' }
      )

      return reply.send({ token, expires_at: expiresAt.toISOString() })
    }
  )
}
