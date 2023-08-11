import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Layout, message, Tabs } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import {
  IPerformer, IUIConfig, ICountry
} from 'src/interfaces';
import {
  updateUserSuccess
} from 'src/redux/user/actions';
import { payoutRequestService, utilsService } from '@services/index';
import PageHeading from '@components/common/page-heading';
import PerformerBankingForm from '@components/performer/banking-form';
import PerformerPaypalForm from '@components/performer/paypalForm';
import '../user/index.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  user: IPerformer;
  ui: IUIConfig;
  countries: ICountry[];
  updateUserSuccess: Function;
  intl: IntlShape;
}
class BankingSettings extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps() {
    const [countries] = await Promise.all([
      utilsService.countriesList()
    ]);
    return {
      countries: countries?.data || []
    };
  }

  state = {
    submiting: false
  };

  async handleUpdatePaypal(data) {
    const { user, intl, updateUserSuccess: onUpdateSuccess } = this.props;
    try {
      this.setState({ submiting: true });
      const resp = await payoutRequestService.updatePayoutMethod('paypal', data);
      onUpdateSuccess({ ...user, paypalSetting: resp.data.value });
      this.setState({ submiting: false });
      message.success(
        intl.formatMessage({
          id: 'paypalAccountWasUpdatedSuccessfully',
          defaultMessage: 'Paypal account was updated successfully'
        })
      );
    } catch (e) {
      const err = await e;
      message.error(
        err?.message
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
      this.setState({ submiting: false });
    }
  }

  async handleUpdateBanking(data) {
    try {
      this.setState({ submiting: true });
      const { user, updateUserSuccess: onUpdateSuccess } = this.props;
      const resp = await payoutRequestService.updatePayoutMethod('banking', data);
      onUpdateSuccess({ ...user, bankingInformation: resp.data.value });
      this.setState({ submiting: false });
      message.success('Banking account was updated successfully!');
    } catch (error) {
      this.setState({ submiting: false });
      const err = await error;
      message.error(err?.message || 'An error orccurred, please try again.');
    }
  }

  render() {
    const {
      ui, user, countries, intl
    } = this.props;
    const {
      submiting
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'bankingToEarn',
              defaultMessage: 'Banking (To Earn)'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            icon={<BankOutlined />}
            title={intl.formatMessage({
              id: 'bankingToEarn',
              defaultMessage: 'Banking (To Earn)'
            })}
          />
          <Tabs>
            <Tabs.TabPane
              tab={(
                <span>
                  <img src="/static/banking-ico.png" alt="banking-icon" height="30px" />
                </span>
              )}
              key="banking"
            >
              <PerformerBankingForm
                onFinish={this.handleUpdateBanking.bind(this)}
                updating={submiting}
                user={user}
                countries={countries}
              />
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={(
                <span>
                  <img
                    src="/static/paypal-ico.png"
                    alt="paypal-icon"
                    height="30px"
                  />
                </span>
              )}
              key="paypal"
            >
              <PerformerPaypalForm
                onFinish={this.handleUpdatePaypal.bind(this)}
                updating={submiting}
                user={user}
              />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui,
  user: state.user.current,
  settings: state.settings
});
const mapDispatch = { updateUserSuccess };
export default injectIntl(connect(mapStates, mapDispatch)(BankingSettings));
