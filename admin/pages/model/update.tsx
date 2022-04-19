import Head from 'next/head';
import { PureComponent, createRef } from 'react';
import { Tabs, message } from 'antd';
import Page from '@components/common/layout/page';
import { AccountForm } from '@components/performer/AccountForm';
import { PerformerDocument } from '@components/performer/Document';
import { SubscriptionForm } from '@components/performer/Subcription';
import { PerformerPaypalForm } from '@components/performer/paypalForm';
import { CommissionSettingForm } from '@components/performer/commission-setting';
import {
  ICountry,
  ILangguges,
  IPhoneCodes,
  IPerformer,
  IBody
} from 'src/interfaces';
import { authService, performerService } from '@services/index';
import Loader from '@components/common/base/loader';
import { utilsService } from '@services/utils.service';
import { UpdatePaswordForm } from '@components/user/update-password-form';
import { BreadcrumbComponent } from '@components/common';
import { omit } from 'lodash';

interface IProps {
  id: string;
  countries: ICountry[];
  languages: ILangguges[];
  phoneCodes: IPhoneCodes[];
  bodyInfo: IBody;
}
class PerformerUpdate extends PureComponent<IProps> {
  static async getInitialProps({ ctx }) {
    const [countries, languages, phoneCodes, bodyInfo] = await Promise.all([
      utilsService.countriesList(),
      utilsService.languagesList(),
      utilsService.phoneCodesList(),
      utilsService.bodyInfo()
    ]);
    return {
      countries: countries?.data || [],
      languages: languages?.data || [],
      phoneCodes: phoneCodes?.data || [],
      bodyInfo: bodyInfo?.data,
      ...ctx.query
    };
  }

  formRef = createRef() as any;

  state = {
    pwUpdating: false,
    updating: false,
    fetching: false,
    performer: {} as IPerformer,
    settingUpdating: false,
    avatarUrl: '',
    coverUrl: ''
  };

  customFields = {};

  async componentDidMount() {
    const { id } = this.props;
    try {
      await this.setState({ fetching: true });
      const resp = await (await performerService.findById(id)).data as IPerformer;
      this.setState({ performer: resp });
      resp.avatar && this.setState({ avatarUrl: resp.avatar });
      resp.cover && this.setState({ coverUrl: resp.cover });
    } catch (e) {
      message.error('Error while fecting performer!');
    } finally {
      this.setState({ fetching: false });
    }
  }

  onFormRefSubmit() {
    this.formRef && this.formRef.formRefSubmit();
  }

  onUploaded(field: string, resp: any) {
    if (field === 'avatarId') {
      this.setState({ avatarUrl: resp.response.data.url });
    }
    if (field === 'coverId') {
      this.setState({ coverUrl: resp.response.data.url });
    }
    this.customFields[field] = resp.response.data._id;
  }

  async updatePassword(data: any) {
    const { id } = this.props;
    try {
      await this.setState({ pwUpdating: true });
      await authService.updatePassword(data.password, id, 'performer');
      message.success('Password has been updated!');
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ pwUpdating: false });
    }
  }

  async updatePaymentGatewaySetting(key: string, data: any) {
    const { id } = this.props;
    try {
      await this.setState({ settingUpdating: true });
      await performerService.updatePaymentGatewaySetting(id, {
        performerId: id,
        key: key || 'ccbill',
        status: 'active',
        value: data
      });
      message.success('Updated successfully!');
    } catch (error) {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ settingUpdating: false });
    }
  }

  async updateCommissionSetting(data: any) {
    const { id } = this.props;
    try {
      await this.setState({ settingUpdating: true });
      await performerService.updateCommissionSetting(id, { ...data, performerId: id });
      message.success('Updated successfully!');
    } catch (error) {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ settingUpdating: false });
    }
  }

  async updateBankingSetting(data: any) {
    const { id } = this.props;
    try {
      await this.setState({ settingUpdating: true });
      await performerService.updateBankingSetting(id, { ...data, performerId: id });
      message.success('Updated successfully!');
    } catch (error) {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ settingUpdating: false });
    }
  }

  async submit(data: any) {
    const { id } = this.props;
    const { performer } = this.state;
    let newData = data;
    try {
      if (data.status === 'pending-email-confirmation') {
        newData = omit(data, ['status']);
      }
      await this.setState({ updating: true });
      const updated = await performerService.update(id, {
        ...omit(performer, ['welcomeVideoId', 'welcomeVideoName', 'welcomeVideoPath']),
        ...newData,
        ...this.customFields
      });
      this.setState({ performer: updated.data });
      message.success('Updated successfully');
    } catch (e) {
      // TODO - exact error message
      const error = await e;
      message.error(error && (error.message || 'An error occurred, please try again!'));
    } finally {
      this.setState({ updating: false });
    }
  }

  render() {
    const {
      pwUpdating, performer, updating, fetching, settingUpdating, avatarUrl, coverUrl
    } = this.state;
    const {
      countries, languages, bodyInfo, phoneCodes
    } = this.props;

    return (
      <>
        <Head>
          <title>Model update</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Models', href: '/model' },
            { title: performer?.name || performer?.username || '' },
            { title: 'Update' }
          ]}
        />
        <Page>
          {fetching ? (
            <Loader />
          ) : (
            <Tabs defaultActiveKey="basic" tabPosition="top">
              <Tabs.TabPane tab={<span>Basic Settings</span>} key="basic">
                <AccountForm
                  onUploaded={this.onUploaded.bind(this)}
                  onFinish={this.submit.bind(this)}
                  performer={performer}
                  submiting={updating}
                  countries={countries}
                  languages={languages}
                  bodyInfo={bodyInfo}
                  avatarUrl={avatarUrl}
                  coverUrl={coverUrl}
                  phoneCodes={phoneCodes}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<span>ID Documents</span>} key="document">
                <PerformerDocument
                  submiting={updating}
                  onUploaded={this.onUploaded.bind(this)}
                  onFinish={this.submit.bind(this)}
                  performer={performer}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<span>Pricing</span>} key="subscription">
                <SubscriptionForm
                  submiting={updating}
                  onFinish={this.submit.bind(this)}
                  performer={performer}
                />
              </Tabs.TabPane>
              {/* <Tabs.TabPane tab={<span>Banking</span>} key="banking">
                <BankingForm
                  submiting={settingUpdating}
                  onFinish={this.updateBankingSetting.bind(this)}
                  bankingInformation={performer.bankingInformation || null}
                  countries={countries}
                />
              </Tabs.TabPane> */}
              <Tabs.TabPane tab={<span>Commission</span>} key="commission">
                <CommissionSettingForm
                  submiting={settingUpdating}
                  onFinish={this.updateCommissionSetting.bind(this)}
                  commissionSetting={performer.commissionSetting}
                />
              </Tabs.TabPane>
              {/* <Tabs.TabPane tab={<span>CCbill</span>} key="ccbill">
                <CCbillSettingForm
                  submiting={settingUpdating}
                  onFinish={this.updatePaymentGatewaySetting.bind(this, 'ccbill')}
                  ccbillSetting={performer.ccbillSetting}
                />
              </Tabs.TabPane> */}
              <Tabs.TabPane tab={<span>Paypal</span>} key="paypal">
                <PerformerPaypalForm
                  updating={settingUpdating}
                  onFinish={this.updatePaymentGatewaySetting.bind(this, 'paypal')}
                  user={performer}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<span>Change password</span>} key="password">
                <UpdatePaswordForm onFinish={this.updatePassword.bind(this)} updating={pwUpdating} />
              </Tabs.TabPane>
            </Tabs>
          )}
        </Page>
      </>
    );
  }
}

export default PerformerUpdate;
