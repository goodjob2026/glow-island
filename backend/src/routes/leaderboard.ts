import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

interface LeaderboardQuery {
  page?: string
  limit?: string
  chapter?: string
  player_id?: string
}

interface SubmitLeaderboardBody {
  display_name: string
  total_score: number
  chapter_reached: number
  highest_level: number
}

// Max score per level per chapter (rough anti-cheat cap)
const MAX_SCORE_PER_CHAPTER = 1_000_000

export async function leaderboardRoutes(app: FastifyInstance, prisma: PrismaClient): Promise<void> {
  // GET /leaderboard
  app.get(
    '/leaderboard',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as LeaderboardQuery

      const page = parseInt(query.page ?? '1', 10)
      const limit = parseInt(query.limit ?? '50', 10)

      if (isNaN(page) || page < 1) {
        return reply.status(400).send({
          error: { code: 'INVALID_PAGE', message: 'page must be a positive integer' },
        })
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return reply.status(400).send({
          error: { code: 'INVALID_LIMIT', message: 'limit must be between 1 and 100' },
        })
      }

      const chapter = query.chapter ? parseInt(query.chapter, 10) : undefined
      if (chapter !== undefined && (isNaN(chapter) || chapter < 1 || chapter > 6)) {
        return reply.status(400).send({
          error: { code: 'INVALID_CHAPTER', message: 'chapter must be between 1 and 6' },
        })
      }

      const whereClause = chapter !== undefined ? { chapterReached: chapter } : {}

      const [totalEntries, entries] = await Promise.all([
        prisma.leaderboardEntry.count({ where: whereClause }),
        prisma.leaderboardEntry.findMany({
          where: whereClause,
          orderBy: [{ totalScore: 'desc' }, { updatedAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      const offset = (page - 1) * limit
      const rankedEntries = entries.map((entry, idx) => ({
        rank: offset + idx + 1,
        player_id: entry.playerId,
        display_name: entry.displayName,
        total_score: Number(entry.totalScore),
        chapter_reached: entry.chapterReached,
        highest_level: entry.highestLevel,
        updated_at: entry.updatedAt.toISOString(),
      }))

      const totalPages = Math.ceil(totalEntries / limit)

      let myRank: Record<string, unknown> | null = null
      if (query.player_id) {
        const playerEntry = await prisma.leaderboardEntry.findUnique({
          where: { playerId: query.player_id },
        })

        if (playerEntry) {
          const rankCount = await prisma.leaderboardEntry.count({
            where: {
              totalScore: { gt: playerEntry.totalScore },
              ...(chapter !== undefined ? { chapterReached: chapter } : {}),
            },
          })
          myRank = {
            rank: rankCount + 1,
            total_score: Number(playerEntry.totalScore),
            chapter_reached: playerEntry.chapterReached,
          }
        }
      }

      return reply.send({
        entries: rankedEntries,
        pagination: {
          page,
          limit,
          total_entries: totalEntries,
          total_pages: totalPages,
        },
        my_rank: myRank,
      })
    }
  )

  // POST /leaderboard/submit
  app.post(
    '/leaderboard/submit',
    { preHandler: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const playerId = request.jwtPayload.player_id
      const body = request.body as SubmitLeaderboardBody

      if (!body.display_name || body.display_name.length < 1 || body.display_name.length > 20) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_DISPLAY_NAME',
            message: 'display_name must be 1-20 characters',
          },
        })
      }

      if (
        typeof body.total_score !== 'number' ||
        body.total_score < 0 ||
        !Number.isInteger(body.total_score)
      ) {
        return reply.status(400).send({
          error: { code: 'INVALID_SCORE', message: 'total_score must be a non-negative integer' },
        })
      }

      if (
        typeof body.chapter_reached !== 'number' ||
        body.chapter_reached < 1 ||
        body.chapter_reached > 6
      ) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_CHAPTER',
            message: 'chapter_reached must be between 1 and 6',
          },
        })
      }

      // Rough anti-cheat cap
      const maxPossibleScore = body.chapter_reached * MAX_SCORE_PER_CHAPTER
      if (body.total_score > maxPossibleScore) {
        return reply.status(422).send({
          error: {
            code: 'SCORE_ROLLBACK_DETECTED',
            message: 'Score exceeds maximum possible for chapter_reached',
          },
        })
      }

      const existing = await prisma.leaderboardEntry.findUnique({ where: { playerId } })

      let isPersonalBest = false

      if (existing) {
        const existingScore = Number(existing.totalScore)
        if (body.total_score < existingScore) {
          // Score decrease — keep existing, not an error, just return current
          const rankCount = await prisma.leaderboardEntry.count({
            where: { totalScore: { gt: existing.totalScore } },
          })
          return reply.send({
            player_id: playerId,
            current_rank: rankCount + 1,
            total_score: existingScore,
            is_personal_best: false,
            updated_at: existing.updatedAt.toISOString(),
          })
        }

        isPersonalBest = body.total_score > existingScore

        const updated = await prisma.leaderboardEntry.update({
          where: { playerId },
          data: {
            displayName: body.display_name,
            totalScore: BigInt(body.total_score),
            chapterReached: body.chapter_reached,
            highestLevel: body.highest_level,
          },
        })

        const rankCount = await prisma.leaderboardEntry.count({
          where: { totalScore: { gt: updated.totalScore } },
        })

        return reply.send({
          player_id: playerId,
          current_rank: rankCount + 1,
          total_score: Number(updated.totalScore),
          is_personal_best: isPersonalBest,
          updated_at: updated.updatedAt.toISOString(),
        })
      } else {
        // New entry
        isPersonalBest = true
        const created = await prisma.leaderboardEntry.create({
          data: {
            playerId,
            displayName: body.display_name,
            totalScore: BigInt(body.total_score),
            chapterReached: body.chapter_reached,
            highestLevel: body.highest_level,
          },
        })

        const rankCount = await prisma.leaderboardEntry.count({
          where: { totalScore: { gt: created.totalScore } },
        })

        return reply.send({
          player_id: playerId,
          current_rank: rankCount + 1,
          total_score: Number(created.totalScore),
          is_personal_best: isPersonalBest,
          updated_at: created.updatedAt.toISOString(),
        })
      }
    }
  )
}
