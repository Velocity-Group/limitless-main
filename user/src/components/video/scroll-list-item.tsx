import { PureComponent } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PerformerListVideo } from '@components/video';
import { Spin } from 'antd';
import { IVideo } from '../../interfaces/video';

interface IProps {
  items: IVideo[];
  canLoadmore: boolean;
  loadMore(): Function;
  loading: boolean;
}

export class ScrollListVideo extends PureComponent<IProps> {
  render() {
    const {
      items, loadMore, canLoadmore = false, loading = false
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
          <PerformerListVideo videos={items} />
        </InfiniteScroll>
        {!loading && !items.length && <div className="text-center">No data was found</div>}
        {loading && <div className="text-center"><Spin /></div>}
      </>
    );
  }
}
