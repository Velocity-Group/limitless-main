/* eslint-disable no-nested-ternary */
import Head from 'next/head';
import { PureComponent } from 'react';
import { message } from 'antd';
import Page from '@components/common/layout/page';
import { orderService } from '@services/index';
import { OrderSearchFilter } from '@components/order';
import OrderTableList from '@components/order/table-list';
import { BreadcrumbComponent } from '@components/common';

interface IProps {
  deliveryStatus: string;
}

class ModelOrderPage extends PureComponent<IProps> {
  static authenticate = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'updatedAt',
    sort: 'desc'
  };

  async componentDidMount() {
    const { deliveryStatus } = this.props;
    if (deliveryStatus) {
      await this.setState({ filter: { deliveryStatus } });
    }
    this.search();
  }

  handleTableChange = async (pagination, filters, sorter) => {
    const pager = { ...pagination };
    pager.current = pagination.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      sort: sorter.order
        ? sorter.order === 'descend'
          ? 'desc'
          : 'asc'
        : 'desc'
    });
    this.search(pager.current);
  };

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.search();
  }

  async search(page = 1) {
    const {
      filter, limit, sort, sortBy, pagination
    } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await orderService.search({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      this.setState({
        searching: false,
        list: resp.data.data,
        pagination: {
          ...pagination,
          total: resp.data.total,
          pageSize: limit
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  render() {
    const { list, searching, pagination } = this.state;

    return (
      <>
        <Head>
          <title>Order History</title>
        </Head>
        <Page>
          <div className="main-container">
            <BreadcrumbComponent
              breadcrumbs={[
                { title: 'Order History', href: '/order' }
              ]}
            />
            <OrderSearchFilter
              onSubmit={this.handleFilter.bind(this)}
            />
            <div style={{ marginBottom: '20px' }} />
            <div className="table-responsive">
              <OrderTableList
                dataSource={list}
                rowKey="_id"
                loading={searching}
                pagination={pagination}
                onChange={this.handleTableChange.bind(this)}
              />
            </div>
          </div>

        </Page>
      </>
    );
  }
}
export default ModelOrderPage;
