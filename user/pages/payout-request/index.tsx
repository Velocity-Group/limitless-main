import { PureComponent } from 'react';
import { Button, message } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import Router from 'next/router';
import Head from 'next/head';
import { connect } from 'react-redux';
import PayoutRequestList from 'src/components/payout-request/table';
import { getResponseError } from '@lib/utils';
import { payoutRequestService } from '@services/index';
import { IUIConfig } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  intl: IntlShape;
}

class PerformerPayoutRequestPage extends PureComponent<IProps> {
  static authenticate = true;

  state = {
    items: [],
    loading: false,
    pagination: {
      pageSize: 10,
      current: 1,
      total: 0
    } as any,
    sort: 'desc',
    sortBy: 'updatedAt',
    filter: {}
  };

  componentDidMount() {
    this.getData();
  }

  async handleTabChange(data) {
    const { pagination } = this.state;
    await this.setState({
      pagination: { ...pagination, current: data.current }
    });
    this.getData();
  }

  async getData() {
    const { intl } = this.props;
    try {
      const {
        filter, sort, sortBy, pagination
      } = this.state;
      await this.setState({ loading: true });
      const resp = await payoutRequestService.search({
        ...filter,
        sort,
        sortBy,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      });
      await this.setState({
        loading: false,
        items: resp.data.data,
        pagination: { ...pagination, total: resp.data.total }
      });
    } catch (error) {
      message.error(
        getResponseError(await error)
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
      this.setState({ loading: false });
    }
  }

  render() {
    const { ui, intl } = this.props;
    const { pagination, items, loading } = this.state;

    return (
      <>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'payoutRequests',
              defaultMessage: 'Payout Requests'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'payoutRequests',
              defaultMessage: 'Payout Requests'
            })}
            icon={<NotificationOutlined />}
          />
          <div style={{ margin: '10px 0' }}>
            <Button
              type="primary"
              onClick={() => Router.push('/payout-request/create')}
            >
              {intl.formatMessage({
                id: 'requestAPayout',
                defaultMessage: 'Request a Payout'
              })}
            </Button>
          </div>
          <div className="table-responsive">
            <PayoutRequestList
              payouts={items}
              searching={loading}
              total={pagination.total}
              onChange={this.handleTabChange.bind(this)}
              pageSize={pagination.pageSize}
            />
          </div>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  ui: state.ui
});
export default injectIntl(connect(mapStateToProps)(PerformerPayoutRequestPage));
