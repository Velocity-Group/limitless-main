import { PureComponent } from 'react';
import Head from 'next/head';
import {
  message, Button, Row, Col, Layout
} from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { productService } from '@services/product.service';
import SearchFilter from '@components/common/search-filter';
import TableListProduct from '@components/product/table-list-product';
import Link from 'next/link';
import { connect } from 'react-redux';
import { IPerformer, IUIConfig } from '@interfaces/index';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  user: IPerformer;
  ui: IUIConfig;
  intl: IntlShape;
}

class Products extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

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
    this.search();
  }

  handleTableChange = (pagination, filters, sorter) => {
    const { pagination: paginationVal } = this.state;
    const pager = { ...paginationVal };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      // eslint-disable-next-line no-nested-ternary
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
    const { intl } = this.props;
    try {
      const {
        filter, limit, sort, sortBy, pagination
      } = this.state;
      await this.setState({ searching: true });
      const resp = await productService.search({
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
      message.error(
        intl.formatMessage({
          id: 'errorOccurredPleaseTryAgainLater',
          defaultMessage: 'Error occurred, please try again later'
        })
      );
      await this.setState({ searching: false });
    }
  }

  async deleteProduct(id: string) {
    const { intl } = this.props;
    // eslint-disable-next-line no-alert
    if (
      !window.confirm(
        intl.formatMessage({
          id: 'youWantToDeleteThisProduct',
          defaultMessage: 'Are you sure you want to delete this product?'
        })
      )
    ) {
      return false;
    }
    try {
      const { pagination } = this.state;
      await productService.delete(id);
      message.success(
        intl.formatMessage({
          id: 'deletedSuccessfully',
          defaultMessage: 'Deleted successfully'
        })
      );
      await this.search(pagination.current);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(
        err.message
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
    }
    return true;
  }

  render() {
    const { list, searching, pagination } = this.state;
    const { ui, intl } = this.props;
    const statuses = [
      {
        key: '',
        text: `${intl.formatMessage({ id: 'all', defaultMessage: 'All' })}`
      },
      {
        key: 'active',
        text: `${intl.formatMessage({
          id: 'active',
          defaultMessage: 'Active'
        })}`
      },
      {
        key: 'inactive',
        text: `${intl.formatMessage({
          id: 'inactive',
          defaultMessage: 'Inactive'
        })}`
      }
    ];

    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'myProducts',
              defaultMessage: 'My Products'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'myProducts',
              defaultMessage: 'My Products'
            })}
            icon={<ShopOutlined />}
          />
          <div>
            <Row>
              <Col lg={20} xs={24}>
                <SearchFilter
                  statuses={statuses}
                  onSubmit={this.handleFilter.bind(this)}
                  searchWithKeyword
                />
              </Col>
              <Col
                lg={4}
                xs={24}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Button className="secondary">
                  <Link href="/model/my-store/create">
                    <a>
                      {intl.formatMessage({
                        id: 'newProduct',
                        defaultMessage: 'New Product'
                      })}
                    </a>
                  </Link>
                </Button>
              </Col>
            </Row>
          </div>
          <div className="table-responsive">
            <TableListProduct
              dataSource={list}
              rowKey="_id"
              loading={searching}
              pagination={pagination}
              onChange={this.handleTableChange.bind(this)}
              deleteProduct={this.deleteProduct.bind(this)}
            />
          </div>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui
});
export default injectIntl(connect(mapStates)(Products));
