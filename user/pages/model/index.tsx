import { PureComponent } from 'react';
import {
  Row, Col, Layout, Pagination, Spin, message
} from 'antd';
import { ModelIcon } from 'src/icons';
import { connect } from 'react-redux';
import PerformerGridCard from '@components/performer/grid-card';
import Head from 'next/head';
import { PerformerAdvancedFilter } from '@components/common/base/performer-advanced-filter';
import PageHeading from '@components/common/page-heading';
import { IUIConfig } from 'src/interfaces/';
import { performerService, utilsService } from 'src/services';
import '@components/performer/performer.less';

interface IProps {
  ui: IUIConfig;
  countries: any;
  bodyInfo: any;
}

class Performers extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  static async getInitialProps() {
    const [countries, bodyInfo] = await Promise.all([
      utilsService.countriesList(),
      utilsService.bodyInfo()
    ]);
    return {
      countries: countries?.data || [],
      bodyInfo: bodyInfo?.data
    };
  }

  state = {
    offset: 0,
    limit: 12,
    filter: {
      sortBy: 'live'
    } as any,
    performers: [],
    total: 0,
    fetching: true
  };

  componentDidMount() {
    this.getPerformers();
  }

  async handleFilter(values: any) {
    const { filter } = this.state;
    await this.setState({ offset: 0, filter: { ...filter, ...values } });
    this.getPerformers();
  }

  async getPerformers() {
    const {
      limit, offset, filter
    } = this.state;
    try {
      await this.setState({ fetching: true });
      const resp = await performerService.search({
        limit,
        offset: limit * offset,
        ...filter
      });
      this.setState({ performers: resp.data.data, total: resp.data.total, fetching: false });
    } catch {
      message.error('Error occured, please try again later');
      this.setState({ fetching: false });
    }
  }

  pageChanged = async (page: number) => {
    await this.setState({ offset: page - 1 });
    this.getPerformers();
  }

  render() {
    const {
      ui, countries, bodyInfo
    } = this.props;
    const {
      limit, offset, performers, fetching, total
    } = this.state;

    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Models
          </title>
        </Head>
        <div className="main-container">
          <PageHeading title="Models" icon={<ModelIcon />} />
          <PerformerAdvancedFilter
            onSubmit={this.handleFilter.bind(this)}
            countries={countries}
            bodyInfo={bodyInfo}
          />
          <Row>
            {performers && performers.length > 0 && performers.map((p) => (
              <Col xs={12} sm={12} md={8} lg={6} key={p._id}>
                <PerformerGridCard performer={p} />
              </Col>
            ))}
          </Row>
          {!total && !fetching && <p className="text-center" style={{ margin: 20 }}>No profile was found</p>}
          {fetching && (
            <div className="text-center" style={{ margin: 30 }}>
              <Spin />
            </div>
          )}
          {total && total > limit ? (
            <Pagination
              showQuickJumper
              defaultCurrent={offset + 1}
              total={total}
              pageSize={limit}
              onChange={this.pageChanged}
            />
          ) : null}
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui }
});

const mapDispatch = { };
export default connect(mapStates, mapDispatch)(Performers);
