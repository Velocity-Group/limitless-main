import { PureComponent } from 'react';
import {
  Layout, message, Button, Row, Col
} from 'antd';
import { PlusOutlined, PictureOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import Head from 'next/head';
import TableListGallery from '@components/gallery/table-list';
import SearchFilter from '@components/common/search-filter';
import Link from 'next/link';
import { galleryService } from '@services/gallery.service';
import { connect } from 'react-redux';
import { IUIConfig } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  intl: IntlShape;
}

interface IStates {
  galleries: [];
  loading: boolean;
  filters: {};
  sortBy: string;
  sort: string;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}

class GalleryListingPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  constructor(props: IProps) {
    super(props);
    this.state = {
      galleries: [],
      loading: true,
      filters: {},
      sortBy: 'createdAt',
      sort: 'desc',
      pagination: { current: 1, pageSize: 12, total: 0 }
    };
  }

  async componentDidMount() {
    this.search();
  }

  async handleSorterChange(pagination, filters, sorter) {
    const { pagination: statePagination } = this.state;
    await this.setState({
      pagination: {
        ...statePagination,
        current: pagination.current
      },
      sortBy: sorter.field || 'createdAt',
      // eslint-disable-next-line no-nested-ternary
      sort: sorter.order ? (sorter.order === 'ascend' ? 'asc' : 'desc') : ''
    });
    this.search();
  }

  async handleDeleteGallery(id: string) {
    const { intl } = this.props;
    if (
      !window.confirm(
        intl.formatMessage({
          id: 'areYouSureYouWantToDeleteThisGallery',
          defaultMessage: 'Are you sure you want to delete this gallery?'
        })
      )
    ) { return; }
    try {
      await galleryService.delete(id);
      message.success(
        intl.formatMessage({
          id: 'yourGalleryWasDeletedSuccessfully',
          defaultMessage: 'Your gallery was deleted successfully'
        })
      );
      this.search();
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
  }

  async handleFilter(params) {
    const { pagination, filters } = this.state;
    await this.setState({
      filters: { ...filters, ...params },
      pagination: {
        ...pagination,
        current: 1
      }
    });
    this.search();
  }

  async search() {
    const { intl } = this.props;
    try {
      const {
        filters, pagination, sort, sortBy
      } = this.state;
      const resp = await galleryService.search({
        ...filters,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        sort,
        sortBy
      });
      await this.setState({
        galleries: resp.data.data,
        pagination: {
          ...pagination,
          total: resp.data.total
        }
      });
    } catch (error) {
      message.error(
        intl.formatMessage({
          id: 'somethingWentWrong',
          defaultMessage: 'Something went wrong, please try again!'
        })
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { ui, intl } = this.props;
    const { galleries, pagination, loading } = this.state;
    const statuses = [
      {
        key: '',
        text: intl.formatMessage({
          id: 'status',
          defaultMessage: 'Status'
        })
      },
      {
        key: 'active',
        text: intl.formatMessage({
          id: 'active',
          defaultMessage: 'Active'
        })
      },
      {
        key: 'inactive',
        text: intl.formatMessage({
          id: 'inactive',
          defaultMessage: 'Inactive'
        })
      }
    ];
    return (
      <Layout>
        <Head>
          <title>
            {' '}
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'myGalleries',
              defaultMessage: 'My Galleries'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'myGalleries',
              defaultMessage: 'My Galleries'
            })}
            icon={<PictureOutlined />}
          />
          <div>
            <Row>
              <Col lg={20} xs={24}>
                <SearchFilter
                  statuses={statuses}
                  searchWithKeyword
                  onSubmit={this.handleFilter.bind(this)}
                />
              </Col>
              <Col
                lg={4}
                xs={24}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Button className="secondary">
                  <Link href="/model/my-gallery/create">
                    <a>
                      <PlusOutlined />
                      {' '}
                      {intl.formatMessage({ id: 'createNew', defaultMessage: 'Create New' })}
                    </a>
                  </Link>
                </Button>
              </Col>
            </Row>
          </div>
          <div className="table-responsive">
            <TableListGallery
              dataSource={galleries}
              rowKey="_id"
              loading={loading}
              pagination={pagination}
              onChange={this.handleSorterChange.bind(this)}
              deleteGallery={this.handleDeleteGallery.bind(this)}
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
export default injectIntl(connect(mapStates)(GalleryListingPage));
