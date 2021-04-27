import { PureComponent } from 'react';
import {
  message, Tag, Spin, Alert, Button
} from 'antd';
import {
  searchService
} from '@services/index';
import Head from 'next/head';
import { connect } from 'react-redux';
import {
  IPerformer, IUIConfig, IUser
} from '@interfaces/index';
import {
  CalendarOutlined, SearchOutlined
} from '@ant-design/icons';
import './index.less';

interface IProps {
  ui: IUIConfig;
  currentUser: IUser | IPerformer;
  keyword: string;
  result: any;
  type: string;
}

class PageSearch extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  state = {
    searching: false,
    items: [],
    offset: 0,
    total: 0,
    dateRange: ''
  }

  async componentDidMount() {
    this.getListKeywords();
  }

  async onSortByDate(dateRange: string) {
    await this.setState({ offset: 0, dateRange, items: [] });
    this.getListKeywords();
  }

  async getListKeywords() {
    const { offset, items, dateRange } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await (await searchService.listByKeyword({
        limit: 99,
        offset: offset * 99,
        dateRange
      })).data;
      this.setState({ items: items.concat(resp.data), total: resp.total });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ searching: false });
    }
  }

  async loadMore() {
    const { offset } = this.state;
    await this.setState({ offset: offset + 1 });
    this.getListKeywords();
  }

  render() {
    const { ui } = this.props;
    const {
      searching, items, total, dateRange
    } = this.state;
    return (
      <div>
        <Head>
          <title>
            {`${ui?.siteName} | What people are searching for?`}
          </title>
        </Head>
        <div className="main-container">
          <div className="heading-top" style={{ marginBottom: 5 }}>
            <SearchOutlined />
            {' '}
            What people are searching for
          </div>
          <div className="date-range">
            <CalendarOutlined />
            <Button type={dateRange === '' ? 'primary' : 'link'} onClick={() => this.onSortByDate('')}>All</Button>
            <Button type={dateRange === 'day' ? 'primary' : 'link'} onClick={() => this.onSortByDate('day')}>Today</Button>
            <Button type={dateRange === 'week' ? 'primary' : 'link'} onClick={() => this.onSortByDate('week')}>Last 7 Days</Button>
            <Button type={dateRange === 'month' ? 'primary' : 'link'} onClick={() => this.onSortByDate('month')}>Last 30 Days</Button>
          </div>
          <div className="list-keyword">
            {items.length > 0 && items.map((item) => (
              <Tag key={item._id} color="processing"><a style={{ fontStyle: 'italic' }}>{`${item.keyword}`}</a></Tag>
            ))}
            {!items.length && !searching && <Alert message="No data was found" />}
            {searching && <div className="text-center"><Spin /></div>}
            {!searching && total > items.length && <div className="text-center"><Button type="link" onClick={() => this.loadMore()}>load more...</Button></div>}
          </div>
        </div>
      </div>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui }
});

export default connect(mapStates)(PageSearch);
