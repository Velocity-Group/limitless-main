import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { message, Layout } from 'antd';
import {
  IPerformer,
  IUIConfig,
  ICountry,
  IBlockCountries
} from 'src/interfaces';
import { StopOutlined } from '@ant-design/icons';
import {
  blockService, utilsService
} from '@services/index';
import { updateUserSuccess } from '@redux/user/actions';
import PageHeading from '@components/common/page-heading';
import '../../user/index.less';
import { injectIntl, IntlShape } from 'react-intl';
import PerformerBlockCountriesForm from '../../../src/components/performer/block-countries-form';

interface IProps {
  currentUser: IPerformer;
  ui: IUIConfig;
  countries: ICountry[];
  intl: IntlShape;
  updateUserSuccess: Function;
}

class BlockCountries extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps() {
    const [countries] = await Promise.all([utilsService.countriesList()]);
    return {
      countries: countries && countries.data ? countries.data : []
    };
  }

  state = {
    submiting: false
  };

  async handleUpdateBlockCountries(data: IBlockCountries) {
    const { intl, currentUser, updateUserSuccess: onUpdateSuccess } = this.props;
    try {
      this.setState({ submiting: true });
      const resp = await blockService.blockCountries(data);
      onUpdateSuccess({ ...currentUser, blockCountries: resp.data });
      this.setState({ submiting: false });
      message.success(
        intl.formatMessage({
          id: 'changesSaved',
          defaultMessage: 'Changes saved'
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

  render() {
    const {
      currentUser, ui, countries, intl
    } = this.props;
    const { submiting } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'blockCountries',
              defaultMessage: 'Block Countries'
            })}
          </title>
        </Head>
        <div className="main-container user-account">
          <PageHeading
            title={intl.formatMessage({
              id: 'blockCountries',
              defaultMessage: 'Block Countries'
            })}
            icon={<StopOutlined />}
          />
          <PerformerBlockCountriesForm
            onFinish={this.handleUpdateBlockCountries.bind(this)}
            updating={submiting}
            blockCountries={currentUser?.blockCountries || { countryCodes: [] }}
            countries={countries}
          />
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  currentUser: state.user.current,
  ui: { ...state.ui }
});
const mapDispatch = {
  updateUserSuccess
};
export default injectIntl(connect(mapStates, mapDispatch)(BlockCountries));
