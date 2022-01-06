import Head from 'next/head';
import { PureComponent } from 'react';
import { message, Layout } from 'antd';
import Page from '@components/common/layout/page';
import { tokenService } from '@services/index';
import { TableListToken } from '@components/token-package/list-token-package';
import { BreadcrumbComponent } from '@components/common';

interface IProps { }

class Tokens extends PureComponent<IProps> {
  state = {
    pagination: {} as any,
    searching: false,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'ordering',
    sort: 'asc'
  };

  async componentDidMount() {
    this.search();
  }

  handleTableChange = async (pagination, filters, sorter) => {
    const pager = { ...pagination };
    pager.current = pagination.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || 'ordering',
      // eslint-disable-next-line no-nested-ternary
      sort: sorter.order
        ? sorter.order === 'descend'
          ? 'desc'
          : 'asc'
        : 'asc'
    });
    this.search(pager.current);
  };

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.search();
  }

  async search(page = 1) {
    try {
      await this.setState({ searching: true });
      const {
        filter, limit, sort, sortBy, pagination
      } = this.state;
      const resp = await tokenService.search({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      await this.setState({
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

  async deleteToken(id: string) {
    const { pagination } = this.state;
    if (!window.confirm('Are you sure you want to delete this token package?')) {
      return;
    }
    try {
      await tokenService.delete(id);
      message.success('Deleted successfully');
      await this.search(pagination.current);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    }
  }

  render() {
    const { list, searching, pagination } = this.state;

    return (
      <Layout>
        <Head>
          <title>Token Packages</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Token Package' }]} />
        <Page>
          <div className="table-responsive">
            <TableListToken
              dataSource={list}
              rowKey="_id"
              loading={searching}
              pagination={pagination}
              onChange={this.handleTableChange.bind(this)}
              deleteToken={this.deleteToken.bind(this)}
            />
          </div>
        </Page>
      </Layout>
    );
  }
}

export default Tokens;
