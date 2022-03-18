import { PureComponent } from 'react';
import {
  Layout, Pagination, Spin, message
} from 'antd';
import { LiveIcon } from 'src/icons';
import { connect } from 'react-redux';
import Head from 'next/head';
import PageHeading from '@components/common/page-heading';
import { SearchFilter } from '@components/common/search-filter';
import { IUIConfig, IUser } from 'src/interfaces/';
import { streamService } from 'src/services';
import '@components/performer/performer.less';
import dynamic from 'next/dynamic';

const AgoraProvider = dynamic(() => import('src/agora/AgoraProvider'), { ssr: false });
const StreamCard = dynamic(() => import('@components/streaming/stream-card'), { ssr: false });

interface IProps {
  ui: IUIConfig;
  user: IUser;
  countries: any;
  bodyInfo: any;
}

class Streaming extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  state = {
    offset: 0,
    limit: 12,
    filter: {
      sortBy: 'updatedAt'
    } as any,
    streams: [],
    total: 0,
    fetching: false
  };

  componentDidMount() {
    this.search();
  }

  handleFilter = async (values: any) => {
    const { filter } = this.state;
    await this.setState({ offset: 0, filter: { ...filter, ...values } });
    this.search();
  }

  search = async () => {
    const {
      limit, offset, filter
    } = this.state;
    try {
      this.setState({ fetching: true });
      const resp = await streamService.search({
        limit,
        offset: limit * offset,
        ...filter
      });
      this.setState({ streams: resp.data.data, total: resp.data.total, fetching: false });
    } catch {
      message.error('Error occured, please try again later');
      this.setState({ fetching: false });
    }
  }

  pageChanged = async (page: number) => {
    await this.setState({ offset: page - 1 });
    this.search();
  }

  render() {
    const {
      ui, user
    } = this.props;
    const {
      limit, offset, streams, fetching, total
    } = this.state;

    return (
      <Layout>
        <AgoraProvider config={{ codec: 'h264', mode: 'live', role: 'audience' }}>
          <Head>
            <title>
              {`${ui.siteName} | Live Videos`}
            </title>
          </Head>
          <div className="main-container">
            <PageHeading title="Live Videos" icon={<LiveIcon />} />
            <SearchFilter searchWithPerformer isFree searchWithKeyword onSubmit={this.handleFilter.bind(this)} />
            {streams.map((s) => (
              <StreamCard loading={fetching} stream={s} user={user} key={s._id} />
            ))}
            {!total && !fetching && <p className="text-center" style={{ margin: 20 }}>No stream was found</p>}
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
        </AgoraProvider>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui,
  user: state.user.current
});

const mapDispatch = { };
export default connect(mapStates, mapDispatch)(Streaming);
