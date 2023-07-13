import {
  Injectable, Inject, HttpException, forwardRef
} from '@nestjs/common';
import { UserDto } from 'src/modules/user/dtos';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { Model } from 'mongoose';
import axios from 'axios';
import { EntityNotFoundException } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { ObjectId } from 'mongodb';
import { VERIFF_MODEL_PROVIDER } from '../providers/auth.provider';
import { VeriffVerificationModel } from '../models';
import { VeriffGeneratePayload } from '../payloads';

const crypto = require('crypto');

@Injectable()
export class VeriffService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(VERIFF_MODEL_PROVIDER)
    private readonly veriffVerificationModel: Model<VeriffVerificationModel>
  ) { }

  private async generateHMAC(payload: string) {
    const secretKey = await SettingService.getValueByKey(SETTING_KEYS.VERIFF_SECRET_KEY);
    if (!secretKey) throw new HttpException('Veriff secret key is missing!', 422);
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');
    return hash;
  }

  public async getDecision(userId: string | ObjectId) {
    const verification = await this.veriffVerificationModel.findOne({ userId });
    if (!verification?.sessionId) throw new EntityNotFoundException();
    const [apiKey, enabled, baseUrl] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.VERIFF_PUBLIC_KEY),
      SettingService.getValueByKey(SETTING_KEYS.VERIFF_ENABLED),
      SettingService.getValueByKey(SETTING_KEYS.VERIFF_BASE_URL)
    ]);
    if (!baseUrl || !enabled || !apiKey) throw new HttpException('Veriff config is missing!', 422);
    try {
      const hmacSignature = await this.generateHMAC(verification.sessionId);
      const resp = await axios.get(
        `${baseUrl}/v1/sessions/${verification.sessionId}/decision`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-HMAC-SIGNATURE': hmacSignature,
            'X-AUTH-CLIENT': apiKey
          }
        }
      ) as any;
      if (resp?.data?.verification) {
        verification.responseData = resp?.data?.verification;
        verification.status = resp?.data?.verification?.status;
        verification.updatedAt = new Date();
        await verification.save();
        if (resp?.data?.verification?.status === 'approved') {
          this.performerService.vefifiedDocument(verification.userId);
        }
      }
      return verification;
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }

  public async generateVerification(payload: VeriffGeneratePayload, user: UserDto): Promise<any> {
    let verification = await this.veriffVerificationModel.findOne({
      userId: user._id
    });
    if (!verification) {
      // eslint-disable-next-line new-cap
      verification = new this.veriffVerificationModel({
        ...payload,
        userSource: user.isPerformer ? 'performer' : 'user',
        userId: user._id,
        createdAt: new Date()
      });
    }

    // delete old session ID
    const [apiKey, enabled, baseUrl] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.VERIFF_PUBLIC_KEY),
      SettingService.getValueByKey(SETTING_KEYS.VERIFF_ENABLED),
      SettingService.getValueByKey(SETTING_KEYS.VERIFF_BASE_URL)
    ]);
    if (baseUrl && enabled && apiKey) {
      const hmacSignature = await this.generateHMAC(verification.sessionId);
      await axios.delete(
        `${baseUrl}/v1/sessions/${verification.sessionId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-HMAC-SIGNATURE': hmacSignature,
            'X-AUTH-CLIENT': apiKey
          }
        }
      ).then().catch((e) => console.log(e));
    }

    verification.sessionId = payload.sessionId;
    verification.responseData = payload.responseData;
    verification.status = payload.status;
    verification.updatedAt = new Date();
    await verification.save();

    return verification;
  }

  // https://developers.veriff.com/#decision-webhook
  public async listenStatusWebhook(payload: any) {
    const { verification: veriff } = payload;
    if (!veriff || !veriff?.id) throw new EntityNotFoundException();
    const verification = await this.veriffVerificationModel.findOne({
      sessionId: veriff.id
    });
    if (!verification) return { ok: false };
    verification.responseData = veriff;
    verification.status = veriff?.status;
    await verification.save();
    if (veriff?.status === 'approved') {
      this.performerService.vefifiedDocument(verification.userId);
    }

    return { ok: true };
  }

  // https://developers.veriff.com/#verification-events
  public async listenEventWebhook(payload: any) {
    // update latest event action to status
    if (!payload || !payload?.id) throw new EntityNotFoundException();
    const verification = await this.veriffVerificationModel.findOne({
      sessionId: payload.id
    });
    if (!verification) return { ok: false };
    verification.status = payload?.action;
    await verification.save();

    return { ok: true };
  }
}
