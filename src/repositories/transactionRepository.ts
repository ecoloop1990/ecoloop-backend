import prisma from '../config/database';
import { Transaction, TransactionStatus, Prisma } from '@prisma/client';

class TransactionRepository {
  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return prisma.transaction.create({
      data,
      include: {
        listing: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  async findByBuyerId(buyerId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { buyerId },
      include: {
        listing: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySellerId(sellerId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { sellerId },
      include: {
        listing: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByListingId(listingId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { listingId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    status: TransactionStatus
  ): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data: { status },
      include: {
        listing: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }
}

export default new TransactionRepository();

