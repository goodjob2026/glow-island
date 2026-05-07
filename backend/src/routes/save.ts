import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

interface PutSaveBody {
  client_updated_at: string
  chapter_progress?: Record<string, unknown>
  currency?: { beach_coins?: number; glowstone?: number }
  materials?: Record<string, number>
  boosters?: Record<string, unknown>
  decorations?: Record<string, unknown>
  monthly_card?: Record<string, unknown>
  settings?: Record<string, unknown>
  client_version?: string
}

function computeChecksum(data: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16)
}

function validateCurrency(currency: unknown): string | null {
  if (!currency || typeof currency !== 'object') return null
  const c = currency as Record<string, unknown>
  if (c.beach_coins !== undefined && (typeof c.beach_coins !== 'number' || c.beach_coins < 0)) {
    return 'NEGATIVE_CURRENCY'
  }
  if (c.glowstone !== undefined && (typeof c.glowstone !== 'number' || c.glowstone < 0)) {
    return 'NEGATIVE_CURRENCY'
  }
  return null
}

function validateMaterials(materials: unknown): string | null {
  if (!materials || typeof materials !== 'object') return null
  const m = materials as Record<string, unknown>
  for (const [, v] of Object.entries(m)) {
    if (typeof v !== 'number' || v < 0) return 'NEGATIVE_MATERIAL'
  }
  return null
}

function validateChapterProgress(chapterProgress: unknown): string | null {
  if (!chapterProgress || typeof chapterProgress !== 'object') return null
  const cp = chapterProgress as Record<string, unknown>
  for (const [chapterKey, chapterData] of Object.entries(cp)) {
    const chapterNum = parseInt(chapterKey, 10)
    if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 6) {
      return 'INVALID_CHAPTER'
    }
    if (chapterData && typeof chapterData === 'object') {
      const cd = chapterData as Record<string, unknown>
      if (cd.stars_earned && Array.isArray(cd.stars_earned)) {
        for (const star of cd.stars_earned) {
          if (typeof star !== 'number' || star < 0 || star > 3) {
            return 'INVALID_STAR_RATING'
          }
        }
      }
    }
  }
  return null
}

export async function saveRoutes(app: FastifyInstance, prisma: PrismaClient): Promise<void> {
  // GET /save/:playerId
  app.get(
    '/save/:playerId',
    { preHandler: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { playerId } = request.params as { playerId: string }
      const tokenPlayerId = request.jwtPayload.player_id

      if (tokenPlayerId !== playerId) {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: 'You cannot access another player\'s save' },
        })
      }

      const save = await prisma.playerSave.findUnique({
        where: { playerId },
      })

      if (!save) {
        // Check if player exists
        const player = await prisma.player.findUnique({ where: { id: playerId } })
        if (!player) {
          return reply.status(404).send({
            error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found' },
          })
        }
        return reply.status(404).send({
          error: { code: 'SAVE_NOT_FOUND', message: 'Save not found' },
        })
      }

      return reply.send({
        player_id: playerId,
        chapter_progress: save.chapterProgress,
        currency: save.currency,
        materials: save.materials,
        boosters: save.boosters,
        decorations: save.decorations,
        monthly_card: save.monthlyCard,
        settings: save.settings,
        updated_at: save.updatedAt.toISOString(),
      })
    }
  )

  // PUT /save/:playerId
  app.put(
    '/save/:playerId',
    { preHandler: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { playerId } = request.params as { playerId: string }
      const tokenPlayerId = request.jwtPayload.player_id

      if (tokenPlayerId !== playerId) {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: 'You cannot modify another player\'s save' },
        })
      }

      const body = request.body as PutSaveBody

      if (!body || !body.client_updated_at) {
        return reply.status(400).send({
          error: { code: 'MISSING_TIMESTAMP', message: 'client_updated_at is required' },
        })
      }

      // Validate inputs
      const currencyError = validateCurrency(body.currency)
      if (currencyError) {
        return reply.status(400).send({
          error: { code: currencyError, message: 'Currency values must be non-negative numbers' },
        })
      }

      const materialsError = validateMaterials(body.materials)
      if (materialsError) {
        return reply.status(400).send({
          error: { code: materialsError, message: 'Material values must be non-negative numbers' },
        })
      }

      const chapterError = validateChapterProgress(body.chapter_progress)
      if (chapterError) {
        return reply.status(400).send({
          error: { code: chapterError, message: 'Invalid chapter progress data' },
        })
      }

      const currentSave = await prisma.playerSave.findUnique({ where: { playerId } })

      if (!currentSave) {
        return reply.status(404).send({
          error: { code: 'SAVE_NOT_FOUND', message: 'Save not found' },
        })
      }

      // Conflict resolution: compare timestamps
      const clientTs = new Date(body.client_updated_at).getTime()
      const serverTs = currentSave.updatedAt.getTime()

      if (clientTs < serverTs) {
        // Conflict: server is newer — return 409 with server save
        return reply.status(409).send({
          error: {
            code: 'SAVE_CONFLICT',
            message: 'Server save is newer than client save. Please merge.',
          },
          server_save: {
            player_id: playerId,
            chapter_progress: currentSave.chapterProgress,
            currency: currentSave.currency,
            materials: currentSave.materials,
            boosters: currentSave.boosters,
            decorations: currentSave.decorations,
            monthly_card: currentSave.monthlyCard,
            settings: currentSave.settings,
            updated_at: currentSave.updatedAt.toISOString(),
          },
        })
      }

      // Build update data — only overwrite provided fields
      const updateData: Record<string, unknown> = {}
      if (body.chapter_progress !== undefined) updateData.chapterProgress = body.chapter_progress
      if (body.currency !== undefined) updateData.currency = body.currency
      if (body.materials !== undefined) updateData.materials = body.materials
      if (body.boosters !== undefined) updateData.boosters = body.boosters
      if (body.decorations !== undefined) updateData.decorations = body.decorations
      if (body.monthly_card !== undefined) updateData.monthlyCard = body.monthly_card
      if (body.settings !== undefined) updateData.settings = body.settings
      if (body.client_version !== undefined) updateData.clientVersion = body.client_version

      const checksumInput = {
        ...updateData,
        playerId,
        client_updated_at: body.client_updated_at,
      }
      updateData.checksum = computeChecksum(checksumInput)

      const updated = await prisma.playerSave.update({
        where: { playerId },
        data: updateData,
      })

      return reply.send({
        player_id: playerId,
        updated_at: updated.updatedAt.toISOString(),
        checksum: updated.checksum,
      })
    }
  )
}
