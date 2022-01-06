import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { message, Layout } from 'antd';
import {
  IPerformer, IUIConfig, ICountry, IBlockCountries
} from 'src/interfaces';
import { StopOutlined } from '@ant-design/icons';
import {
  blockService, utilsService
} from '@services/index';
import {
  PerformerBlockCountriesForm
} from '@components/performer';
import '../../user/index.less';
import PageHeading from '@components/common/page-heading';

interface IProps {
  performer: IPerformer;
  ui: IUIConfig;
  countries: ICountry[];
}

class BlockCountries extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps() {
    const [countries] = await Promise.all([
      utilsService.countriesList()
    ]);
    return {
      countries: countries && countries.data ? countries.data : []
    };
  }

  state = {
    submiting: false
  }

  async handleUpdateBlockCountries(data: IBlockCountries) {
    try {
      await this.setState({ submiting: true });
      await blockService.blockCountries(data);
      this.setState({ submiting: false });
      message.success('Changes saved');
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try againl later');
      this.setState({ submiting: false });
    }
  }

  render() {
    const {
      performer, ui, countries
    } = this.props;
    const { submiting } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Block Countries
          </title>
        </Head>
        <div className="main-container user-account">
          <PageHeading title="Block Countries" icon={<StopOutlined />} />
          <PerformerBlockCountriesForm
            onFinish={this.handleUpdateBlockCountries.bind(this)}
            updating={submiting}
            blockCountries={performer?.blockCountries || { countryCodes: [] }}
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
};
export default connect(mapStates, mapDispatch)(BlockCountries);
