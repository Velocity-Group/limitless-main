import { PureComponent } from 'react';
import Head from 'next/head';
import {
  message, Layout, Button, Row, Col
} from 'antd';
import { VideoCameraOutlined, UploadOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { videoService } from '@services/video.service';
import SearchFilter from '@components/common/search-filter';
import TableListVideo from '@components/video/table-list';
import Link from 'next/link';
import { connect } from 'react-redux';
import { IUIConfig } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  intl: IntlShape;
}

class Videos extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  state = {
    pagination: {} as any,
    searching: false,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'updatedAt',
    sort: 'desc'
  };

  componentDidMount() {
    this.search();
  }

  handleTableChange = (pagination, filters, sorter) => {
    const { pagination: paginationVal } = this.state;
    const pager = { ...paginationVal };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || '',
      // eslint-disable-next-line no-nested-ternary
      sort: sorter.order ? (sorter.order === 'descend' ? 'desc' : 'asc') : ''
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
      const resp = await videoService.search({
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

  async deleteVideo(id: string) {
    const { intl } = this.props;
    // eslint-disable-next-line no-alert
    if (
      !window.confirm(
        intl.formatMessage({
          id: 'youWantToDeleteThisVideo',
          defaultMessage: 'Are you sure you want to delete this video?'
        })
      )
    ) {
      return false;
    }
    try {
      const { pagination } = this.state;
      await videoService.delete(id);
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
    return undefined;
  }

  render() {
    const { list, searching, pagination } = this.state;
    const { ui, intl } = this.props;
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
            {ui?.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'myVideos',
              defaultMessage: 'My Videos'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'myVideos',
              defaultMessage: 'My Videos'
            })}
            icon={<VideoCameraOutlined />}
          />
          <div>
            <Row>
              <Col lg={16} xs={24}>
                <SearchFilter
                  searchWithKeyword
                  statuses={statuses}
                  onSubmit={this.handleFilter.bind(this)}
                />
              </Col>
              <Col
                lg={8}
                xs={24}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end'
                }}
              >
                <Button className="primary">
                  <Link href="/model/my-video/upload">
                    <a>
                      {' '}
                      <UploadOutlined />
                      {' '}
                      {intl.formatMessage({
                        id: 'uploadNew',
                        defaultMessage: 'Upload new'
                      })}
                    </a>
                  </Link>
                </Button>
                &nbsp;
                <Button className="secondary">
                  <Link href="/model/my-video/bulk-upload">
                    <a>
                      <UploadOutlined />
                      {' '}
                      {intl.formatMessage({
                        id: 'bulkUpload',
                        defaultMessage: 'Bulk upload'
                      })}
                    </a>
                  </Link>
                </Button>
              </Col>
            </Row>
          </div>
          <div className="table-responsive">
            <TableListVideo
              dataSource={list}
              rowKey="_id"
              loading={searching}
              pagination={pagination}
              onChange={this.handleTableChange.bind(this)}
              onDelete={this.deleteVideo.bind(this)}
            />
          </div>
        </div>
      </Layout>
    );
  }
}
const mapStates = (state) => ({
  ui: state.ui
});
export default injectIntl(connect(mapStates)(Videos));
