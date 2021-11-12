import { PrismaClient, Prisma } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient()

const getUserByID = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id }
  })
}

const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email }
  })
}

const upsertUser = async (data: Prisma.UserCreateInput) => {
  console.log({ data })
  return await prisma.user.upsert({
    where: {
      email: data.email
    },
    update: {
      ...data
    },
    create: data,
  })
}

// const updateUser = async (id: string, data) => {
//   return await prisma.user.update({
//     where: {
//       id
//     },
//     data
//   })
// }

const createAccount = async (userId: number, address: string) => {
  let account = await prisma.account.findFirst({
    where: { userId, address }
  })
  if (!account) {
    account = await prisma.account.create({
      data: {
        userId,
        address
      }
    })
  }

  return account;
}

// const getAccountsForUser = async ({ userId }) => {
//   return await prisma.account.findMany({
//     where: { userId }
//   })
// }
// const getAccountByAddress = async ({ address }) => {
//   return await prisma.account.findUnique({
//     where: { address }
//   })
// }

// const createPaymentLink = async ({ amount, sentToId, sentById }) => {
//   return await prisma.paymentLink.create({
//     data: {
//       id: uuidv4(),
//       amount, sentToId, sentById
//     }
//   })
// }

// const getPaymentLink = async ({ id }) => {
//   return await prisma.paymentLink.findUnique({
//     where: { id }
//   })
// }

// const upsertUser = async ({ email, accessToken, refreshToken }) => {
//   return await prisma.user.upsert({
//     where: {
//       email
//     },
//     update: {
//       email,
//       accessToken, refreshToken
//     },
//     create: {
//       email, accessToken, refreshToken
//     },
//   })
// }

export { upsertUser, getUserByEmail, createAccount }