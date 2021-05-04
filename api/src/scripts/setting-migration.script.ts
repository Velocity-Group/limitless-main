import { Injectable } from '@nestjs/common';
import { SettingService } from 'src/modules/settings';
import { SettingCreatePayload } from 'src/modules/settings/payloads';
import { SETTING_KEYS } from 'src/modules/settings/constants';

@Injectable()
export class SettingMigration {
  constructor(private readonly settingService: SettingService) { }

  async up() {
    const settings = [
      {
        key: SETTING_KEYS.SITE_NAME,
        value: process.env.SITE_NAME || process.env.DOMAIN || 'Application',
        name: 'Site name',
        description: 'Global name',
        public: true,
        group: 'general',
        editable: true
      },
      {
        key: SETTING_KEYS.LOGO_URL,
        value: '',
        name: 'Logo',
        description: 'Site logo',
        public: true,
        group: 'general',
        editable: true,
        meta: {
          upload: true,
          image: true
        }
      },
      {
        key: SETTING_KEYS.FAVICON,
        value: '',
        name: 'Favicon',
        description: 'Site Favicon',
        public: true,
        group: 'general',
        editable: true,
        meta: {
          upload: true,
          image: true
        }
      },
      {
        key: SETTING_KEYS.LOGIN_PLACEHOLDER_IMAGE,
        value: '',
        name: 'Placeholder img',
        description: 'Login placeholder image',
        public: true,
        group: 'general',
        editable: true,
        meta: {
          upload: true,
          image: true
        }
      },
      {
        key: SETTING_KEYS.FOOTER_CONTENT,
        value: `<p style="text-align:center;"><strong>${process.env.DOMAIN} © Copyright 2021</strong></p><p style="text-align:center;"></p style="text-align: center"><img src="https://www.dmca.com/img/dmca_logo.png?=sd" alt="" style="width: 70px"/><p></p>`,
        name: 'Footer content',
        description: 'Add texts for your footer here',
        public: true,
        group: 'general',
        editable: true,
        type: 'text-editor'
      },
      {
        key: SETTING_KEYS.USER_BENEFIT,
        // eslint-disable-next-line quotes
        value: `<ul><li>View exclusive content</li><li>Monthly and Yearly subscriptions</li><li>Fast and reliable buffering and viewing</li><li>Multiple solution options to choose from</li><li>Chat with model</li><li>Access model's personal store</li><li>Search and filter capabilities</li><li>Favorite your video for future viewing</li></ul>`,
        name: 'User Benefit',
        description: 'Add User benefit content here',
        public: true,
        group: 'general',
        editable: true,
        type: 'text-editor'
      },
      {
        key: SETTING_KEYS.MODEL_BENEFIT,
        value: '<ul><li>Lightning fast uploading</li><li>Multi-video uploading</li><li>Chat with fans</li><li>Cross-over-content between models</li><li>Individual model store</li><li>Affiliate program for blogs to promote your content</li><li>80% Standard commission rate</li><li>Deduct 5% when gained from affiliate</li></ul>',
        name: 'Model Benefit',
        description: 'Add Model benefit content here',
        public: true,
        group: 'general',
        editable: true,
        type: 'text-editor'
      },
      {
        key: SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION,
        value: false,
        name: 'Mandatory email verification',
        description:
          'If active, user must verify email before login to system',
        type: 'boolean',
        public: false,
        group: 'general',
        editable: true
      },
      {
        key: SETTING_KEYS.MAINTENANCE_MODE,
        value: false,
        name: 'Maintenance mode',
        description:
          'If active, user will see maintenance page once visiting site',
        type: 'boolean',
        public: true,
        group: 'general',
        editable: true
      },
      {
        key: SETTING_KEYS.PERFORMER_VERIFY_NUMBER,
        value: 5,
        name: 'Verification model account',
        description:
          'Minimum number of subscribers to verify model\'s account',
        type: 'number',
        public: true,
        group: 'general',
        editable: true
      },
      {
        key: SETTING_KEYS.ADMIN_EMAIL,
        value: process.env.ADMIN_EMAIL || `admin@${process.env.DOMAIN}`,
        name: 'Admin email',
        description: 'Email will receive information from site features',
        public: false,
        group: 'email',
        editable: true
      },
      {
        key: SETTING_KEYS.SENDER_EMAIL,
        value: process.env.SENDER_EMAIL || `noreply@${process.env.DOMAIN}`,
        name: 'Sender email',
        description: 'Email will send application email',
        public: false,
        group: 'email',
        editable: true
      },
      {
        key: SETTING_KEYS.META_KEYWORDS,
        value: '',
        name: 'Home meta keywords',
        description: 'Custom meta keywords',
        public: true,
        group: 'custom',
        editable: true
      },
      {
        key: SETTING_KEYS.META_DESCRIPTION,
        value: '',
        name: 'Home meta description',
        description: 'Custom meta description',
        public: true,
        group: 'custom',
        editable: true,
        type: 'text',
        meta: {
          textarea: true
        }
      },
      {
        key: SETTING_KEYS.HEADER_SCRIPT,
        value: '',
        name: 'Custom header script',
        description: 'Custom code in <head> tag',
        public: true,
        group: 'custom',
        editable: true,
        type: 'text',
        meta: {
          textarea: true
        }
      },
      {
        key: SETTING_KEYS.AFTER_BODY_SCRIPT,
        value: '',
        name: 'Custom body script',
        description: 'Custom code at end of <body> tag',
        public: true,
        group: 'custom',
        editable: true,
        type: 'text',
        meta: {
          textarea: true
        }
      },
      {
        key: SETTING_KEYS.MONTHLY_SUBSCRIPTION_COMMISSION,
        value: 0.2,
        name: 'Monthly subscription commission',
        description: 'Commission is 0.01 to 0.99 (1%-99%)',
        public: false,
        group: 'commission',
        editable: true,
        type: 'number'
      },
      {
        key: SETTING_KEYS.YEARLY_SUBSCRIPTION_COMMISSION,
        value: 0.2,
        name: 'Yearly subscription commission',
        description: '0.2 mean that Admin will get 20% of total tokens earned & user will get 80%',
        public: false,
        group: 'commission',
        editable: true,
        type: 'number'
      },
      {
        key: SETTING_KEYS.VIDEO_SALE_COMMISSION,
        value: 0.2,
        name: 'Video commission',
        description: '',
        public: false,
        group: 'commission',
        editable: true,
        type: 'number'
      },
      {
        key: SETTING_KEYS.GALLERY_SALE_COMMISSION,
        value: 0.2,
        name: 'Gallery commission',
        description: '',
        public: false,
        group: 'commission',
        editable: true,
        type: 'number'
      },
      {
        key: SETTING_KEYS.PRODUCT_SALE_COMMISSION,
        value: 0.2,
        name: 'Product commission',
        description: '',
        public: false,
        group: 'commission',
        editable: true,
        type: 'number'
      },
      {
        key: SETTING_KEYS.FEED_SALE_COMMISSION,
        value: 0.2,
        name: 'Post Feed commission',
        public: false,
        group: 'commission',
        editable: true,
        type: 'number'
      },
      {
        key: SETTING_KEYS.TIP_COMMISSION,
        value: 0.2,
        name: 'Tip commission',
        description: '',
        public: false,
        group: 'commission',
        editable: true,
        type: 'number'
      },
      // {
      //   key: SETTING_KEYS.MESSAGE_COMMISSION,
      //   value: 0.2,
      //   name: 'Message commission',
      //   description: '',
      //   public: false,
      //   group: 'commission',
      //   editable: true,
      //   type: 'number'
      // },
      {
        key: SETTING_KEYS.STREAM_COMMISSION,
        value: 0.2,
        name: 'Streaming commission',
        description: '',
        public: false,
        group: 'commission',
        editable: true,
        type: 'number'
      },
      {
        key: SETTING_KEYS.CCBILL_CLIENT_ACCOUNT_NUMBER,
        value: '',
        name: 'Client account number',
        description: 'CCbill merchant account number (eg: 987654)',
        public: false,
        group: 'ccbill',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.CCBILL_SUB_ACCOUNT_NUMBER,
        value: '',
        name: 'Sub account number',
        description: 'CCbill sub account number',
        public: false,
        group: 'ccbill',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.CCBILL_FLEXFORM_ID,
        value: '',
        name: 'Flexform ID',
        description: 'CCbill flexform ID',
        public: false,
        group: 'ccbill',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.CCBILL_SALT,
        value: '',
        name: 'Salt key',
        description: 'CCbill main-account or sub-account salt key',
        public: false,
        group: 'ccbill',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.SMTP_TRANSPORTER,
        value: {
          host: '',
          port: 465,
          secure: true,
          auth: {
            user: '',
            pass: ''
          }
        },
        name: 'SMTP Transport',
        description: 'Set up SMTP here',
        public: false,
        group: 'mailer',
        editable: true,
        type: 'mixed'
      },
      {
        key: SETTING_KEYS.GOOGLE_ANALYTICS_CODE,
        value: '',
        name: 'GA code',
        description: 'Google Analytics Code eg: GA-123456xx',
        public: true,
        group: 'analytics',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.GOOGLE_CLIENT_ID,
        value: '',
        name: 'GG Client ID',
        description: 'Google Client ID',
        public: true,
        group: 'socials',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.GOOGLE_CLIENT_SECRET,
        value: '',
        name: 'GG Client Secret',
        description: 'Google Client Secret',
        public: false,
        group: 'socials',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.TWITTER_CLIENT_ID,
        value: '',
        name: 'Twitter Client ID',
        description: 'Twitter Client ID',
        public: true,
        group: 'socials',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.TWITTER_CLIENT_SECRET,
        value: '',
        name: 'Twitter Client Secret',
        description: 'Twitter Client Secret',
        public: false,
        group: 'socials',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.ANT_MEDIA_API_ENDPOINT,
        value: '',
        name: 'Api Server',
        description: 'Ant Media Api Server Endpoint eg https://stream.yourserver.com',
        public: false,
        group: 'ant',
        editable: true,
        visible: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.ANT_MEDIA_APPNAME,
        value: 'LiveApp',
        name: 'App Name',
        description: 'Ant Media AppName (LiveApp, WebRTCApp, WebRTCAppEE)',
        public: true,
        group: 'ant',
        editable: true,
        visible: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.VIEWER_URL,
        value: '',
        name: 'Viewer url ',
        description: 'Viewer URL',
        public: true,
        group: 'ant',
        editable: true,
        visible: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.GOOGLE_RECAPTCHA_SITE_KEY,
        value: '',
        name: 'Google Re-captcha site key',
        description: 'Google Re-captcha v2 site key',
        public: true,
        group: 'recaptcha',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.GOOGLE_RECAPTCHA_SECRET_KEY,
        value: '',
        name: 'Google Re-captcha secret key',
        description: 'Google Re-captcha v2 secret key',
        public: false,
        group: 'recaptcha',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.PUBLISHER_URL,
        value: '',
        name: 'Publisher url ',
        description: 'Publisher URL',
        public: true,
        group: 'ant',
        editable: true,
        type: 'text'
      },
      {
        key: SETTING_KEYS.SUBSCRIBER_URL,
        value: '',
        name: 'Subscriber url ',
        description: 'Subscriber URL',
        public: true,
        group: 'ant',
        editable: true,
        extra: 'Apply for Ant enterprise option only',
        type: 'text'
      },
      {
        key: SETTING_KEYS.OPTION_FOR_BROADCAST,
        value: 'hls',
        name: 'Option for broadcast ',
        description: 'Option Broadcast',
        public: true,
        group: 'ant',
        editable: true,
        type: 'radio',
        extra: 'Apply for Ant enterprise option only',
        meta: {
          value: [{ key: 'hls', name: 'HLS' }, { key: 'webrtc', name: 'webRTC' }]
        }
      },
      {
        key: SETTING_KEYS.OPTION_FOR_GROUP,
        value: 'hls',
        name: 'Option for group ',
        description: 'Option Group',
        public: true,
        group: 'ant',
        editable: true,
        type: 'radio',
        extra: 'Apply for Ant enterprise option only',
        meta: {
          value: [{ key: 'hls', name: 'HLS' }, { key: 'webrtc', name: 'webRTC' }]
        }
      },
      {
        key: SETTING_KEYS.OPTION_FOR_PRIVATE,
        value: 'hls',
        name: 'Option for private ',
        description: 'Option Private',
        public: true,
        group: 'ant',
        editable: true,
        type: 'radio',
        extra: 'Apply for Ant enterprise option only',
        meta: {
          value: [{ key: 'hls', name: 'HLS' }, { key: 'webrtc', name: 'webRTC' }]
        }
      },
      {
        key: SETTING_KEYS.SECURE_OPTION,
        value: false,
        name: 'Secure option ',
        description: 'Option Secure',
        public: true,
        group: 'ant',
        editable: true,
        type: 'boolean',
        extra: 'Apply for Ant enterprise option only'
      },
      {
        key: SETTING_KEYS.ENABLE_GOOGLE_RECAPTCHA,
        value: false,
        name: 'Enable Re-captcha',
        description: 'If active, site require re-captcha on login',
        public: true,
        group: 'recaptcha',
        editable: true,
        type: 'boolean'
      }
    ] as any;

    // eslint-disable-next-line no-restricted-syntax
    for (const setting of settings) {
      // eslint-disable-next-line no-await-in-loop
      const test = await this.settingService.get(setting.key);
      if (!test) {
        const payload = new SettingCreatePayload();
        payload.key = setting.key;
        payload.value = setting.value;
        payload.name = setting.name;
        payload.description = setting.description;
        payload.public = setting.public;
        payload.editable = setting.editable;
        payload.group = setting.group;
        payload.type = setting.type || 'text';
        payload.meta = setting.meta;
        // eslint-disable-next-line no-await-in-loop
        await this.settingService.create(payload);
      } else {
        // eslint-disable-next-line no-console
        console.log(`Key ${setting.key} has been existed!`);
      }
    }
  }
}
