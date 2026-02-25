import { Request, Response, NextFunction } from 'express';
import transactionService from '../services/transactionService';
import { AppError } from '../middlewares/errorHandler'
import logger from '../config/logger';

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    const transaction = await transactionService.createTransaction(
      req.user.userId,
      req.body
    );

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create transaction');
    if (error instanceof Error) {
      next(new AppError(error.message, 400));
      return;
    }
    next(error);
  }
};

export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(id);

    if (!transaction) {
      next(new AppError('Transaction not found', 404));
      return;
    }

    res.status(200).json({ transaction });
  } catch (error) {
    logger.error(
      { error, transactionId: req.params.id },
      'Failed to get transaction'
    );
    next(error);
  }
};

export const updateTransactionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const transaction = await transactionService.updateTransactionStatus(
      id,
      status,
      req.user.userId
    );

    res.status(200).json({
      message: 'Transaction status updated successfully',
      transaction,
    });
  } catch (error) {
    logger.error(
      { error, transactionId: req.params.id },
      'Failed to update transaction status'
    );
    if (error instanceof Error) {
      next(new AppError(error.message, 400));
      return;
    }
    next(error);
  }
};

export const getMyTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    const type = req.query.type as string; // 'buyer' or 'seller'

    let transactions;
    if (type === 'seller') {
      transactions = await transactionService.getTransactionsBySeller(
        req.user.userId
      );
    } else {
      transactions = await transactionService.getTransactionsByBuyer(
        req.user.userId
      );
    }

    res.status(200).json({ transactions, count: transactions.length });
  } catch (error) {
    logger.error({ error }, 'Failed to get user transactions');
    next(error);
  }
};

