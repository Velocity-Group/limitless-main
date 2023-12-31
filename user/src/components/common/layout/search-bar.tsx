import { PureComponent } from 'react';
import {
  Input, message
} from 'antd';
import { searchService } from '@services/index';
import './search-bar.less';
import { debounce } from 'lodash';
import Router from 'next/router';
import { injectIntl, IntlShape } from 'react-intl';

const { Search } = Input;
interface IProps { intl: IntlShape }

class SearchBar extends PureComponent<IProps> {
  state = {
    result: {} as any,
    searching: false,
    searched: false,
    keyword: ''
  }

  onSearch = debounce(async (e) => {
    const { intl } = this.props;
    this.setState({ keyword: e });
    if (!e) {
      this.setState({ searched: false });
      return;
    }
    try {
      this.setState({ searching: true, searched: false });
      const data = await searchService.searchByKeyword({ keyword: e });
      if (data) {
        this.setState({ searching: false, result: data.data });
      }
    } catch (error) {
      const err = await error;
      message.error(err?.message || intl.formatMessage({ id: 'errorOccuredPleaseTryAgainLater', defaultMessage: 'Error occured, please try again later' }));
    } finally {
      this.setState({ searching: false, searched: true });
    }
  }, 600)

  onChangeRoute(type) {
    const { result, keyword } = this.state;
    this.setState({ searched: false });
    switch (type) {
      case 'performer': Router.push({ pathname: '/search', query: { type: 'performer', keyword, result: JSON.stringify(result) } });
        break;
      case 'feed': Router.push({ pathname: '/search', query: { type: 'feed', keyword, result: JSON.stringify(result) } });
        break;
      case 'story': Router.push({ pathname: '/search', query: { type: 'story', keyword, result: JSON.stringify(result) } });
        break;
      case 'blog': Router.push({ pathname: '/search', query: { type: 'blog', keyword, result: JSON.stringify(result) } });
        break;
      case 'product': Router.push({ pathname: '/search', query: { type: 'product', keyword, result: JSON.stringify(result) } });
        break;
      default: break;
    }
  }

  render() {
    const {
      searching, result, searched
    } = this.state;
    const { intl } = this.props;
    const {
      totalPerformer = 0, totalFeed = 0, totalStory = 0, totalProduct = 0
    } = result;

    return (
      <div className="search-bar">
        <Search
          placeholder="Type to search here ..."
          onChange={(e) => {
            e.persist();
            this.onSearch(e.target.value);
          }}
          loading={searching}
          allowClear
          enterButton
        />
        {!searching && searched && (
          <ul className="drop-hint">
            <li aria-hidden onClick={() => this.onChangeRoute('performer')}><a>{`${totalPerformer} ${intl.formatMessage({ id: 'models', defaultMessage: 'Models' })}`}</a></li>
            <li aria-hidden onClick={() => this.onChangeRoute('feed')}><a>{`${totalFeed} ${intl.formatMessage({ id: 'posts', defaultMessage: 'Posts' })}`}</a></li>
            <li aria-hidden onClick={() => this.onChangeRoute('story')}><a>{`${totalStory} ${intl.formatMessage({ id: 'stories', defaultMessage: 'Stories' })}`}</a></li>
            <li aria-hidden onClick={() => this.onChangeRoute('product')}><a>{`${totalProduct} ${intl.formatMessage({ id: 'products', defaultMessage: 'Products' })}`}</a></li>
          </ul>
        )}
      </div>
    );
  }
}

export default injectIntl(SearchBar);
