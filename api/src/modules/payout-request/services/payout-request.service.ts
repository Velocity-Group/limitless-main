import {
  Injectable, Inject, ForbiddenException, forwardRef, HttpException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PerformerService } from 'src/modules/performer/services';
import { MailerService } from 'src/modules/mailer';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import {
  EntityNotFoundException,
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { merge, uniq } from 'lodash';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import * as moment from 'moment';
import { EARNING_MODEL_PROVIDER, REFERRAL_EARNING_MODEL_PROVIDER } from 'src/modules/earning/providers/earning.provider';
import { EarningModel, ReferralEarningModel } from 'src/modules/earning/models';
import { UserDto } from 'src/modules/user/dtos';
import { StripeService } from 'src/modules/payment/services';
import { PAYMENT_STATUS, PAYMENT_TYPE } from 'src/modules/payment/constants';
import {
  PAYOUT_REQUEST_CHANEL, PAYOUT_REQUEST_EVENT, SOURCE_TYPE, STATUSES
} from '../constants';
import { DuplicateRequestException, InvalidRequestTokenException } from '../exceptions';
import { PayoutRequestDto } from '../dtos/payout-request.dto';
import {
  PayoutRequestCreatePayload,
  PayoutRequestSearchPayload,
  PayoutRequestUpdatePayload,
  PayoutRequestPerformerUpdatePayload
} from '../payloads/payout-request.payload';
import { PayoutRequestModel } from '../models/payout-request.model';
import { PAYOUT_REQUEST_MODEL_PROVIDER } from '../providers/payout-request.provider';
import { PayoutMethodService } from './payout-method.service';

@Injectable()
export class PayoutRequestService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly earningModel: Model<EarningModel>,
    @Inject(REFERRAL_EARNING_MODEL_PROVIDER)
    private readonly referralEarningModel: Model<ReferralEarningModel>,
    @Inject(PAYOUT_REQUEST_MODEL_PROVIDER)
    private readonly payoutRequestModel: Model<PayoutRequestModel>,
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService,
    private readonly payoutMethodService: PayoutMethodService
  ) { }

  public async search(
    req: PayoutRequestSearchPayload,
    user?: UserDto
  ): Promise<any> {
    const query = {} as any;
    if (req.sourceId) {
      query.sourceId = toObjectId(req.sourceId);
    }

    if (req.source) {
      query.source = req.source;
    }

    if (req.status) {
      query.status = req.status;
    }

    let sort = {
      updatedAt: -1
    } as any;

    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).endOf('day').toDate()
      };
    }

    const [data, total] = await Promise.all([
      this.payoutRequestModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.payoutRequestModel.countDocuments(query)
    ]);
    const requests = data.map((d) => new PayoutRequestDto(d));
    if (user?.roles?.includes('admin')) {
      const sourceIds = uniq(requests.map((r) => r.sourceId));
      const sources = await this.performerService.findByIds(sourceIds);
      requests.forEach((request: PayoutRequestDto) => {
        const sourceInfo = sources.find((s) => s && s._id.toString() === request.sourceId.toString());
        request.sourceInfo = sourceInfo && new PerformerDto(sourceInfo).toResponse();
      });
    }
    return {
      total,
      data: requests
    };
  }

  public async findById(id: string | object): Promise<any> {
    const request = await this.payoutRequestModel.findById(id);
    return request;
  }

  public async requestPayout(
    payload: PayoutRequestCreatePayload,
    user: UserDto
  ): Promise<PayoutRequestDto> {
    if (payload.paymentAccountType === 'stripe') {
      const stripeConnect = await this.stripeService.getConnectAccount(user._id);
      if (!stripeConnect || !stripeConnect.payoutsEnabled || !stripeConnect.detailsSubmitted) {
        throw new HttpException('You have not connect with Stripe yet, please try again later', 422);
      }
    }
    if (payload.paymentAccountType === 'paypal') {
      const paymentAccountInfo = await this.payoutMethodService.findOne({ sourceId: user._id, key: 'paypal' });
      if (!paymentAccountInfo?.value?.email) {
        throw new HttpException('You have not provided your Paypal account yet, please try again later', 422);
      }
    }
    if (payload.paymentAccountType === 'banking') {
      const paymentAccountInfo = await this.payoutMethodService.findOne({ sourceId: user._id, key: 'banking' });
      if (!paymentAccountInfo || !paymentAccountInfo?.value?.firstName || !paymentAccountInfo?.value?.lastName || !paymentAccountInfo?.value?.bankAccount) {
        throw new HttpException('Missing banking information', 404);
      }
    }
    const data = {
      ...payload,
      source: user.isPerformer ? SOURCE_TYPE.PERFORMER : SOURCE_TYPE.USER,
      tokenConversionRate: 1,
      sourceId: user._id,
      updatedAt: new Date(),
      createdAt: new Date()
    } as PayoutRequestModel;

    const query = {
      sourceId: user._id,
      source: user.isPerformer ? SOURCE_TYPE.PERFORMER : SOURCE_TYPE.USER,
      status: STATUSES.PENDING
    };
    const request = await this.payoutRequestModel.findOne(query);
    if (request) {
      throw new DuplicateRequestException();
    }
    if (user.balance < data.requestTokens) {
      throw new InvalidRequestTokenException();
    }
    const resp = await this.payoutRequestModel.create(data);
    const adminEmail = (SettingService.getValueByKey(SETTING_KEYS.ADMIN_EMAIL)) || process.env.ADMIN_EMAIL;
    adminEmail && await this.mailService.send({
      subject: 'New payout request',
      to: adminEmail,
      data: {
        request: resp,
        requestName: user?.name || user?.username || 'N/A'
      },
      template: 'admin-payout-request'
    });
    return new PayoutRequestDto(resp);
  }

  public async calculate(
    user: UserDto,
    payload?: any
  ): Promise<any> {
    let sourceId = user._id;
    if (user.roles && user.roles.includes('admin') && payload.sourceId) {
      sourceId = payload.sourceId;
    }
    const rejectTypes = [
      PAYMENT_TYPE.TOKEN_PACKAGE, PAYMENT_TYPE.FREE_SUBSCRIPTION
    ];
    const [totalPerformerEarned, totalReferralEarned, previousPaidOut] = await Promise.all([
      this.earningModel.aggregate([
        {
          $match: {
            performerId: toObjectId(sourceId),
            type: { $nin: rejectTypes },
            transactionStatus: PAYMENT_STATUS.SUCCESS
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            referralId: toObjectId(sourceId),
            type: { $nin: rejectTypes },
            transactionStatus: PAYMENT_STATUS.SUCCESS
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ]),
      this.payoutRequestModel.aggregate([
        {
          $match: {
            sourceId: toObjectId(sourceId),
            status: STATUSES.DONE
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$requestTokens'
            }
          }
        }
      ])
    ]);

    return {
      totalEarnings: ((totalPerformerEarned[0] && totalPerformerEarned[0].total) || 0) + ((totalReferralEarned[0] && totalReferralEarned[0].total) || 0),
      previousPaidOut: (previousPaidOut[0] && previousPaidOut[0].total) || 0
    };
  }

  public async updatePayout(
    id: string,
    payload: PayoutRequestPerformerUpdatePayload,
    user: UserDto
  ): Promise<PayoutRequestDto> {
    const payout = await this.payoutRequestModel.findOne({ _id: id });
    if (!payout) {
      throw new EntityNotFoundException();
    }
    if (payout.status !== 'processing') {
      throw new ForbiddenException();
    }
    if (user._id.toString() !== payout.sourceId.toString()) {
      throw new ForbiddenException();
    }
    if (payload.paymentAccountType === 'stripe') {
      const stripeConnect = await this.stripeService.getConnectAccount(user._id);
      if (!stripeConnect || !stripeConnect.payoutsEnabled || !stripeConnect.detailsSubmitted) {
        throw new HttpException('You have not connect with Stripe yet, please try again later', 422);
      }
    }
    if (payload.paymentAccountType === 'paypal') {
      const paymentAccountInfo = await this.payoutMethodService.findOne({ sourceId: user._id, key: 'paypal' });
      if (!paymentAccountInfo?.value?.email) {
        throw new HttpException('You have not provided your Paypal account yet, please try again later', 422);
      }
    }
    if (payload.paymentAccountType === 'banking') {
      const paymentAccountInfo = await this.payoutMethodService.findOne({ sourceId: user._id, key: 'banking' });
      if (!paymentAccountInfo || !paymentAccountInfo?.value?.firstName || !paymentAccountInfo?.value?.lastName || !paymentAccountInfo?.value?.bankAccount) {
        throw new HttpException('Missing banking information', 404);
      }
    }
    if (user.balance < payout.requestTokens) {
      throw new InvalidRequestTokenException();
    }
    merge(payout, payload);
    payout.updatedAt = new Date();
    payout.tokenConversionRate = SettingService.getValueByKey(SETTING_KEYS.TOKEN_CONVERSION_RATE) || 1;
    await payout.save();
    // const adminEmail = (await this.settingService.getKeyValue(SETTING_KEYS.ADMIN_EMAIL)) || process.env.ADMIN_EMAIL;
    // adminEmail && await this.mailService.send({
    //   subject: 'New payout request',
    //   to: adminEmail,
    //   data: {
    //     request: payout,
    //     performer
    //   },
    //   template: 'admin-payout-request'
    // });
    return new PayoutRequestDto(payout);
  }

  public async details(id: string, user: UserDto) {
    const payout = await this.payoutRequestModel.findById(id);
    if (!payout) {
      throw new EntityNotFoundException();
    }

    if (user._id.toString() !== payout.sourceId.toString()) {
      throw new ForbiddenException();
    }

    const data = new PayoutRequestDto(payout);
    data.sourceInfo = new PerformerDto(user).toSearchResponse() || null;
    return data;
  }

  public async adminDetails(id: string) {
    const payout = await this.payoutRequestModel.findById(id);
    if (!payout) {
      throw new EntityNotFoundException();
    }
    const data = new PayoutRequestDto(payout);
    const { sourceId, source, paymentAccountType } = data;
    if (source === SOURCE_TYPE.PERFORMER) {
      const sourceInfo = await this.performerService.findById(sourceId);
      if (sourceInfo) {
        data.sourceInfo = new PerformerDto(sourceInfo).toResponse();
        if (paymentAccountType === 'paypal') {
          const paymentAccountInfo = await this.payoutMethodService.findOne({ sourceId: sourceInfo._id, key: 'paypal' });
          data.paymentAccountInfo = paymentAccountInfo?.value;
        }
        if (paymentAccountType === 'banking') {
          const paymentAccountInfo = await this.payoutMethodService.findOne({ sourceId: sourceInfo._id, key: 'banking' });
          data.paymentAccountInfo = paymentAccountInfo?.value;
        }
      }
    }
    return data;
  }

  public async adminDelete(id: string) {
    const payout = await this.payoutRequestModel.findById(id);
    if (!payout) {
      throw new EntityNotFoundException();
    }
    if ([STATUSES.DONE, STATUSES.REJECTED].includes(payout.status)) {
      throw new ForbiddenException();
    }
    await payout.remove();
    return { deleted: true };
  }

  public async adminUpdateStatus(
    id: string | ObjectId,
    payload: PayoutRequestUpdatePayload
  ): Promise<any> {
    const request = await this.payoutRequestModel.findById(id);
    if (!request) {
      throw new EntityNotFoundException();
    }

    const oldStatus = request.status;
    merge(request, payload);
    request.updatedAt = new Date();
    await request.save();

    const event: QueueEvent = {
      channel: PAYOUT_REQUEST_CHANEL,
      eventName: PAYOUT_REQUEST_EVENT.UPDATED,
      data: {
        request,
        oldStatus
      }
    };
    await this.queueEventService.publish(event);
    return request;
  }

  public async adminStripePayout(
    id: string | ObjectId
  ): Promise<any> {
    const request = await this.payoutRequestModel.findById(id);
    if (!request) {
      throw new EntityNotFoundException();
    }
    const payout = await this.stripeService.createPayout(request);
    if (payout) {
      request.payoutId = payout.id;
      request.status = STATUSES.DONE;
      request.updatedAt = new Date();
      await request.save();

      const oldStatus = request.status;

      const event: QueueEvent = {
        channel: PAYOUT_REQUEST_CHANEL,
        eventName: PAYOUT_REQUEST_EVENT.UPDATED,
        data: {
          request,
          oldStatus
        }
      };
      await this.queueEventService.publish(event);
    }
    return request;
  }
}
