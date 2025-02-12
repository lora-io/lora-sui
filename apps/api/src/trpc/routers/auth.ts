import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { getMessageText } from '../../utils/crypto'
import { JwtPayload, UserRole } from '@repo/schema'
import { jwtSign } from '../../utils/jwt'
import { prisma } from '@repo/db'
import { User } from '@prisma/client'

export const authRouter = router({
  message: publicProcedure.query(() => {
    return {
      message: getMessageText(),
    }
  }),
  logInSui: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
        signature: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { wallet } = input

      const user = await findOrCreateUser({ suiWallet: wallet })
      const payload: JwtPayload = { userId: user.id, userRole: UserRole.User }
      const token = jwtSign(payload)

      return {
        token,
        userId: user.id,
      }
    }),
})

export async function findOrCreateUser(params: { suiWallet: string }): Promise<User> {
  const user = await prisma.user.findFirst({ where: params })

  if (user) {
    return prisma.user.update({
      where: { id: user.id },
      data: {},
    })
  }

  return prisma.user.create({ data: { ...params } })
}
