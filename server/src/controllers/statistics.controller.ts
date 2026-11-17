import { NextFunction, Request, Response } from 'express';
import { getMonthlyStatistics } from '../services/statistics.service';
import { validateStatisticsQuery } from '../validators/statistics.validator';

const userId = (req: Request) => req.session.userId as string;

export async function getMonthly(req: Request, res: Response, next: NextFunction) {
  try {
    const { month } = validateStatisticsQuery(req.query);
    res.status(200).json(await getMonthlyStatistics(userId(req), month));
  } catch (error) {
    next(error);
  }
}
