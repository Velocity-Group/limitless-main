import { PureComponent } from 'react';
import { Alert, Spin } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PerformerListVideo } from '@components/video';
import { IVideo } from '../../interfaces/video';

interface IProps {
  items: IVideo[];
  total?: number;
  canLoadmore: boolean;
  loadMore(): Function;
  loading: boolean;
}

export class ScrollListVideo extends PureComponent<IProps> {
  render() {
    const {
      items, loadMore, loading, canLoadmore
    } = this.props;
    return (
      <InfiniteScroll
        dataLength={items.length}
        hasMore={canLoadmore}
        loader={null}
        next={loadMore}
        endMessage={null}
        scrollThreshold={0.9}
      >
        <PerformerListVideo videos={items} />
        {!items.length && !loading && <div className="main-container custom"><Alert className="text-center" message="No video was found" type="info" /></div>}
        {loading && <div className="text-center"><Spin /></div>}
      </InfiniteScroll>
    );
  }
}
