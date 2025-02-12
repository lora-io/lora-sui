import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import { JwtPayload } from '@repo/schema'
import { jwtVerify } from '../utils/jwt'

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  let user: JwtPayload | null = null
  const authorizationHeader = req.headers.authorization
  if (authorizationHeader) {
    const token = authorizationHeader.split(' ')[1]
    try {
      user = jwtVerify(token)
    } catch (error) {
      // ignore
    }
  }

  return { req, res, user }
}

export type Context = Awaited<ReturnType<typeof createContext>>
