import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import https from 'https'
import { SKU_CONFIG } from '../types/index'

interface IapVerifyBody {
  sku_id: string
  platform: string
  receipt_data: string
  product_id?: string
  transaction_id?: string
}

const VALID_PLATFORMS = ['ios', 'android', 'taptap']
const VALID_SKUS = Object.keys(SKU_CONFIG)

const APPLE_VERIFY_PROD = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_VERIFY_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt'

async function verifyAppleReceipt(
  receiptData: string,
  useSandbox = false
): Promise<{ status: number; environment?: string }> {
  const url = useSandbox ? APPLE_VERIFY_SANDBOX : APPLE_VERIFY_PROD
  const body = JSON.stringify({
    'receipt-data': receiptData,
    password: process.env.APPLE_SHARED_SECRET ?? '',
  })
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST' }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as { status: number; environment?: string })
        } catch {
          reject(new Error('Apple receipt parse failed'))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

const HOURGLASS_BASE_COINS = 15
const HOURGLASS_MONTHLY_CARD_COINS = 30

export async function iapRoutes(app: FastifyInstance, prisma: PrismaClient): Promise<void> {
  // POST /hourglass/claim
  app.post(
    '/hourglass/claim',
    { preHandler: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const playerId = request.jwtPayload.player_id
      const body = request.body as { has_monthly_card?: boolean }

      const coinsGranted = body.has_monthly_card ? HOURGLASS_MONTHLY_CARD_COINS : HOURGLASS_BASE_COINS

      const save = await prisma.playerSave.findUnique({ where: { playerId } })
      if (!save) {
        return reply.status(404).send({ error: { code: 'SAVE_NOT_FOUND', message: 'Player save not found' } })
      }

      const currency = save.currency as { beach_coins: number; glowstone: number }
      await prisma.playerSave.update({
        where: { playerId },
        data: {
          currency: {
            ...currency,
            beach_coins: (currency.beach_coins ?? 0) + coinsGranted,
          } as object,
        },
      })

      return reply.send({ beach_coins_granted: coinsGranted })
    }
  )

  // POST /iap/verify
  app.post(
    '/iap/verify',
    { preHandler: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const playerId = request.jwtPayload.player_id
      const body = request.body as IapVerifyBody

      // Validate required fields
      if (!body.receipt_data) {
        return reply.status(400).send({
          error: { code: 'MISSING_RECEIPT', message: 'receipt_data is required' },
        })
      }

      if (!body.sku_id || !VALID_SKUS.includes(body.sku_id)) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_SKU',
            message: `sku_id must be one of: ${VALID_SKUS.join(', ')}`,
          },
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

      const sku = SKU_CONFIG[body.sku_id]

      // Quick duplicate check by transaction_id (if provided)
      if (body.transaction_id) {
        const existingByTxId = await prisma.iapTransaction.findUnique({
          where: { transactionId: body.transaction_id },
        })
        if (existingByTxId) {
          return reply.status(409).send({
            error: {
              code: 'DUPLICATE_RECEIPT',
              message: 'This transaction has already been processed',
            },
            original_transaction_id: existingByTxId.id,
            processed_at: existingByTxId.createdAt.toISOString(),
          })
        }
      }

      // Also check by receipt_data for duplicate detection
      const existingByReceipt = await prisma.iapTransaction.findFirst({
        where: {
          receiptData: body.receipt_data,
          status: { in: ['verified', 'pending'] },
        },
      })
      if (existingByReceipt) {
        return reply.status(409).send({
          error: {
            code: 'DUPLICATE_RECEIPT',
            message: 'This receipt has already been processed',
          },
          original_transaction_id: existingByReceipt.id,
          processed_at: existingByReceipt.createdAt.toISOString(),
        })
      }

      // Business rule checks
      if (sku.is_starter_pack || sku.is_first_pack) {
        const skuKey = sku.is_first_pack ? body.sku_id : 'starter_pack'
        const errorCode = sku.is_first_pack ? 'FIRST_PACK_ALREADY_PURCHASED' : 'STARTER_PACK_ALREADY_PURCHASED'
        const alreadyBought = await prisma.iapTransaction.findFirst({
          where: { playerId, skuId: skuKey, status: 'verified' },
        })
        if (alreadyBought) {
          return reply.status(422).send({
            error: { code: errorCode, message: 'This pack can only be purchased once' },
          })
        }
      }

      if (sku.is_monthly_card) {
        const save = await prisma.playerSave.findUnique({ where: { playerId } })
        if (save) {
          const monthlyCard = save.monthlyCard as {
            active?: boolean
            expires_at?: string | null
          }
          if (monthlyCard?.active && monthlyCard.expires_at) {
            const expiresAt = new Date(monthlyCard.expires_at)
            if (expiresAt > new Date()) {
              return reply.status(422).send({
                error: {
                  code: 'MONTHLY_CARD_ALREADY_ACTIVE',
                  message: 'Monthly card is already active',
                },
              })
            }
          }
        }
      }

      // Apple receipt verification (iOS only)
      if (body.platform === 'ios') {
        const isDevelopment =
          process.env.NODE_ENV === 'development' || process.env.APPLE_IAP === 'sandbox'

        if (!isDevelopment) {
          let appleResult = await verifyAppleReceipt(body.receipt_data, false)
          // Apple status 21007 = receipt is from sandbox; retry against sandbox endpoint
          if (appleResult.status === 21007) {
            appleResult = await verifyAppleReceipt(body.receipt_data, true)
          }
          if (appleResult.status !== 0) {
            return reply.status(422).send({
              error: {
                code: 'APPLE_RECEIPT_INVALID',
                message: `Apple receipt verification failed (status ${appleResult.status})`,
              },
            })
          }
        }
      }

      // Generate a synthetic transaction ID for sandbox / non-iOS platforms
      const platformTransactionId =
        body.transaction_id ?? `sandbox_${Date.now()}_${Math.random().toString(36).slice(2)}`

      const productId = body.product_id ?? sku.product_id
      const now = new Date()

      // Perform DB operations in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create IAP transaction record
        const iapTx = await tx.iapTransaction.create({
          data: {
            playerId,
            productId,
            skuId: body.sku_id,
            platform: body.platform,
            receiptData: body.receipt_data,
            transactionId: platformTransactionId,
            amountCents: sku.amount_cents,
            currencyCode: 'CNY',
            status: 'verified',
            glowstoneGranted: sku.glowstone,
            itemsGranted: sku.items,
            verifiedAt: now,
          },
        })

        // Get current save
        const currentSave = await tx.playerSave.findUnique({ where: { playerId } })
        if (!currentSave) {
          throw new Error('SAVE_NOT_FOUND')
        }

        const currency = currentSave.currency as { beach_coins: number; glowstone: number }
        const newGlowstone = (currency.glowstone ?? 0) + sku.glowstone

        // Determine beach_coins delta from starter pack
        let beachCoinsDelta = 0
        for (const item of sku.items) {
          if (item.type === 'currency' && item.item_id === 'beach_coins') {
            beachCoinsDelta += item.quantity
          }
        }

        const updatedCurrency = {
          beach_coins: (currency.beach_coins ?? 0) + beachCoinsDelta,
          glowstone: newGlowstone,
        }

        // Update boosters if starter pack includes them
        let updatedBoosters = currentSave.boosters as Record<string, number>
        for (const item of sku.items) {
          if (item.type === 'booster') {
            updatedBoosters = {
              ...updatedBoosters,
              [item.item_id]: ((updatedBoosters[item.item_id] as number) ?? 0) + item.quantity,
            }
          }
        }

        // Update monthly card if applicable
        let updatedMonthlyCard = currentSave.monthlyCard
        if (sku.is_monthly_card) {
          const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          updatedMonthlyCard = {
            active: true,
            expires_at: expiresAt.toISOString(),
            purchased_at: now.toISOString(),
            last_claimed_date: null,
            days_claimed: 0,
            transaction_id: iapTx.id,
          }
        }

        const updatedSave = await tx.playerSave.update({
          where: { playerId },
          data: {
            currency: updatedCurrency as object,
            boosters: updatedBoosters as object,
            monthlyCard: updatedMonthlyCard as object,
          },
        })

        return { iapTx, updatedSave, updatedCurrency }
      })

      const responseBody: Record<string, unknown> = {
        transaction_id: result.iapTx.id,
        sku_id: body.sku_id,
        status: 'verified',
        glowstone_granted: sku.glowstone,
        items_granted: sku.items,
        updated_currency: result.updatedCurrency,
      }

      if (sku.is_first_pack) {
        responseBody.first_pack_bonus = sku.items
      }

      return reply.send(responseBody)
    }
  )
}
