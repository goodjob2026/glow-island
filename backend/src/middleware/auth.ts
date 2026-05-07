import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { JwtPayload } from '../types/index'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    jwtPayload: JwtPayload
  }
}

export function registerAuthDecorator(app: FastifyInstance): void {
  app.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        await request.jwtVerify()
        const payload = request.user as JwtPayload
        request.jwtPayload = payload
      } catch (err) {
        reply.status(401).send({
          error: {
            code: 'TOKEN_INVALID',
            message: 'Invalid or missing authentication token',
          },
        })
      }
    }
  )
}
