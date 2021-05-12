import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PerformerService } from 'src/modules/performer/services';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserService } from 'src/modules/user/services';
import { PAYMENT_TRANSACTION_MODEL_PROVIDER } from '../providers';
import { PaymentTransactionModel } from '../models';
import { PaymentSearchPayload } from '../payloads';
import { PaymentDto } from '../dtos';

@Injectable()
export class PaymentSearchService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(PAYMENT_TRANSACTION_MODEL_PROVIDER)
    private readonly paymentTransactionModel: Model<PaymentTransactionModel>
  ) { }

  public async getUserTransactions(req: PaymentSearchPayload, user: PerformerDto) {
    const query = {
      sourceId: user._id
    } as any;
    if (req.type) query.type = req.type;
    if (req.status) query.status = req.status;
    if (req.performerId) query.performerId = req.performerId;
    if (req.performerIds) query.performerId = { $in: req.performerIds };
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate),
        $lt: moment(req.toDate)
      };
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.paymentTransactionModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.paymentTransactionModel.countDocuments(query)
    ]);
    const PIds = data.map((d) => d.performerId);
    const [performers] = await Promise.all([
      this.performerService.findByIds(PIds)
    ]);
    const transactions = data.map((v) => new PaymentDto(v));

    transactions.forEach((transaction) => {
      if (transaction.performerId) {
        const performerInfo = performers.find(
          (t) => t._id.toString() === transaction.performerId.toString()
        );
        if (performerInfo) {
          // eslint-disable-next-line no-param-reassign
          transaction.performerInfo = performerInfo.toResponse();
        }
      }
    });
    return {
      data: transactions.map((trans) => new PaymentDto(trans).toResponse(false)),
      total
    };
  }

  public async adminGetUserTransactions(req: PaymentSearchPayload) {
    const query = {} as any;
    if (req.sourceId) query.sourceId = req.sourceId;
    if (req.source) query.source = req.source;
    if (req.type) query.type = req.type;
    if (req.status) query.status = req.status;
    if (req.target) query.target = req.target;
    if (req.targetId) query.targetId = req.targetId;
    if (req.performerId) query.performerId = req.performerId;
    if (req.performerIds) query.performerId = { $in: req.performerIds };
    if (req.paymentGateway) query.paymentGateway = req.paymentGateway;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate),
        $lt: moment(req.toDate)
      };
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.paymentTransactionModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.paymentTransactionModel.countDocuments(query)
    ]);
    const UIds = data.map((d) => d.sourceId);
    const PIds = data.map((d) => d.targetId);
    const [users, performers] = await Promise.all([
      this.userService.findByIds(UIds),
      this.performerService.findByIds(PIds)
    ]);
    const transactions = data.map((v) => new PaymentDto(v));
    transactions.forEach((transaction) => {
      if (transaction.sourceId) {
        const sourceInfo = users.find(
          (t) => t._id.toString() === transaction.sourceId.toString()
        );
        if (sourceInfo) {
          // eslint-disable-next-line no-param-reassign
          transaction.sourceInfo = sourceInfo.toResponse();
        }
      }
      if (transaction.performerId) {
        const performerInfo = performers.find(
          (t) => t._id.toString() === transaction.performerId.toString()
        );
        if (performerInfo) {
          // eslint-disable-next-line no-param-reassign
          transaction.performerInfo = performerInfo.toResponse();
        }
      }
    });
    return {
      data: transactions.map((trans) => new PaymentDto(trans).toResponse(true)),
      total
    };
  }

  public async findByQuery(query: any) {
    return this.paymentTransactionModel.find(query);
  }
}
