import { Transaction, TransactionStatus, ListingStatus } from '@prisma/client';
import transactionRepository from '../repositories/transactionRepository';
import listingRepository from '../repositories/listingRepository';
import { CreateTransactionRequest } from '../types';
import logger from '../config/logger';

class TransactionService {
  async createTransaction(
    buyerId: string,
    data: CreateTransactionRequest
  ): Promise<Transaction> {
    // Verify listing exists and is available
    const listing = await listingRepository.findById(data.listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new Error('Listing is not available for purchase');
    }

    if (listing.sellerId === buyerId) {
      throw new Error('Cannot purchase your own listing');
    }

    // Verify quantity is available
    if (data.quantity > listing.quantity) {
      throw new Error('Insufficient quantity available');
    }

    // Calculate total price
    const totalPrice = listing.price * data.quantity;

    // Create transaction
    const transaction = await transactionRepository.create({
      status: TransactionStatus.PENDING,
      price: totalPrice,
      quantity: data.quantity,
      co2Saved: listing.co2Saved
        ? (listing.co2Saved * data.quantity) / listing.quantity
        : null,
      listing: {
        connect: { id: data.listingId },
      },
      buyer: {
        connect: { id: buyerId },
      },
      seller: {
        connect: { id: listing.sellerId },
      },
    });

    logger.info(
      {
        transactionId: transaction.id,
        listingId: data.listingId,
        buyerId,
        sellerId: listing.sellerId,
      },
      'Transaction created'
    );

    return transaction;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return transactionRepository.findById(id);
  }

  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    userId: string
  ): Promise<Transaction> {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify user is part of the transaction
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new Error('Unauthorized: You can only update your own transactions');
    }

    // Update transaction status
    const updatedTransaction = await transactionRepository.updateStatus(
      id,
      status
    );

    // If transaction is completed, update listing status
    if (status === TransactionStatus.COMPLETED) {
      const listing = await listingRepository.findById(transaction.listingId);
      if (listing) {
        const remainingQuantity = listing.quantity - transaction.quantity;
        if (remainingQuantity <= 0) {
          await listingRepository.updateStatus(
            transaction.listingId,
            ListingStatus.SOLD
          );
        } else {
          await listingRepository.update(transaction.listingId, {
            quantity: remainingQuantity,
          });
        }
      }
    }

    logger.info(
      {
        transactionId: id,
        status,
        userId,
      },
      'Transaction status updated'
    );

    return updatedTransaction;
  }

  async getTransactionsByBuyer(buyerId: string): Promise<Transaction[]> {
    return transactionRepository.findByBuyerId(buyerId);
  }

  async getTransactionsBySeller(sellerId: string): Promise<Transaction[]> {
    return transactionRepository.findBySellerId(sellerId);
  }

  async getTransactionsByListing(listingId: string): Promise<Transaction[]> {
    return transactionRepository.findByListingId(listingId);
  }
}

export default new TransactionService();

