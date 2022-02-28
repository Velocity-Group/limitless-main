import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';

@Injectable()
export class AgoraService {
  constructor(private readonly configService: ConfigService) {}

  buildTokenWithAccount(
    channelName: string,
    account: string,
    role = RtcRole.PUBLISHER
  ): string {
    const appId = SettingService.getValueByKey(SETTING_KEYS.AGORA_APPID);
    const appCertificate = SettingService.getValueByKey(
      SETTING_KEYS.AGORA_CERTIFICATE
    );
    if (!appId || !appCertificate) {
      throw new BadRequestException();
    }

    const expirationTimeInSeconds = this.configService.get('agora').expirationTimeInSeconds || 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithAccount(
      appId,
      appCertificate,
      channelName,
      account,
      role,
      privilegeExpiredTs
    );
  }
}
