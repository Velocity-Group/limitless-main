import { PureComponent } from 'react';
import { Alert, Spin } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { IFeed } from '@interfaces/index';
import { injectIntl, IntlShape } from 'react-intl';
import FeedCard from './post-card';
import { FeedGridCard } from './grid-card';

interface IProps {
  items: IFeed[];
  canLoadmore: boolean;
  loadMore(): Function;
  onDelete(): Function;
  loading?: boolean;
  isGrid?: boolean;
  notFoundText?: string;
  intl: IntlShape
}

class ScrollListFeed extends PureComponent<IProps> {
  render() {
    const {
      items = [],
      loadMore,
      onDelete,
      canLoadmore,
      loading = false,
      isGrid = false,
      notFoundText,
      intl
    } = this.props;
    return (
      <InfiniteScroll
        dataLength={items.length}
        hasMore={canLoadmore}
        loader={null}
        next={loadMore}
        endMessage={null}
        scrollThreshold={0.8}
      >
        <div className={isGrid ? 'grid-view' : 'fixed-scroll'}>
          {items.length > 0
            && items.map((item) => {
              if (isGrid) {
                return <FeedGridCard feed={item} key={item._id} />;
              }
              return (
                <FeedCard
                  feed={item}
                  key={item._id}
                  onDelete={onDelete.bind(this)}
                />
              );
            })}
        </div>
        {!items.length && !loading && (
          <div className="main-container custom">
            <Alert
              className="text-center"
              message={notFoundText || intl.formatMessage({ id: 'noPostWasFound', defaultMessage: 'No post was found' })}
              type="info"
            />
          </div>
        )}
        {loading && (
          <div className="text-center">
            <Spin />
          </div>
        )}
      </InfiniteScroll>
    );
  }
}

export default injectIntl(ScrollListFeed);
