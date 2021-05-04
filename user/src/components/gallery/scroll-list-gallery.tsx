import { PureComponent } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import {
  Row, Col, Spin, Alert
} from 'antd';
import GalleryCard from '@components/gallery/gallery-card';
import { IGallery } from '../../interfaces';

interface IProps {
  items: IGallery[];
  total?: number;
  canLoadmore: boolean;
  loadMore(): Function;
  loading: boolean;
  handleShowPhotos: Function;
}

export class ScrollListGallery extends PureComponent<IProps> {
  render() {
    const {
      items, loadMore, loading, canLoadmore, handleShowPhotos
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
          <Row>
            {items.length > 0
              && items.map((gallery: IGallery) => (
                <Col xs={12} sm={12} md={6} lg={6} key={gallery._id}>
                  <GalleryCard onShow={handleShowPhotos} gallery={gallery} />
                </Col>
              ))}
          </Row>
          {!items.length && !loading && <div className="main-container custom"><Alert className="text-center" message="No data was found" type="info" /></div>}
          {loading && <div className="text-center"><Spin /></div>}
        </InfiniteScroll>
      </>
    );
  }
}
