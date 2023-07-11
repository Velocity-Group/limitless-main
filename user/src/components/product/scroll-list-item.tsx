import { PureComponent } from 'react';
import { Alert, Spin } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { IProduct } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';
import { PerformerListProduct } from './performer-list-product';

interface IProps {
  items: IProduct[];
  canLoadmore: boolean;
  loadMore(): Function;
  loading: boolean;
  notFoundText?: string;
  intl: IntlShape
}

class ScrollListProduct extends PureComponent<IProps> {
  render() {
    const {
      items = [], loadMore, canLoadmore = false, loading = false, notFoundText, intl
    } = this.props;
    return (
      <>
        <InfiniteScroll
          dataLength={items.length}
          hasMore={canLoadmore}
          loader={null}
          next={loadMore}
          endMessage={null}
          scrollThreshold={0.9}
        >
          <PerformerListProduct products={items} />
          {!loading && !items.length && (
          <div className="main-container custom">
            <Alert
              className="text-center"
              type="info"
              message={notFoundText || intl.formatMessage({ id: 'noProductWasFound', defaultMessage: 'No product was found' })}
            />
          </div>
          )}
          {loading && <div className="text-center"><Spin /></div>}
        </InfiniteScroll>
      </>
    );
  }
}

export default injectIntl(ScrollListProduct);
