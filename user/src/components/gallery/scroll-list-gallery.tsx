import { PureComponent } from 'react';
import {
  Spin, Row, Col, Alert
} from 'antd';
import { IGallery } from '@interfaces/gallery';
import InfiniteScroll from 'react-infinite-scroll-component';
import { injectIntl, IntlShape } from 'react-intl';
import GalleryCard from './gallery-card';

interface IProps {
  items: IGallery[];
  canLoadmore: boolean;
  loadMore(): Function;
  loading: boolean;
  notFoundText?: string;
  intl: IntlShape
}

class ScrollListGallery extends PureComponent<IProps> {
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
          <Row>
            {items.length > 0
              && items.map((gallery: IGallery) => (
                <Col
                  xs={12}
                  sm={12}
                  md={8}
                  lg={6}
                  xl={6}
                  key={gallery._id}
                >
                  <GalleryCard gallery={gallery} />
                </Col>
              ))}
          </Row>
        </InfiniteScroll>
        {!loading && !items.length && (
          <div className="main-container custom">
            <Alert
              className="text-center"
              type="info"
              message={notFoundText || intl.formatMessage({ id: 'noGalleryWasFound', defaultMessage: 'No gallery was found' })}
            />
          </div>
        )}
        {loading && <div className="text-center"><Spin /></div>}
      </>
    );
  }
}

export default injectIntl(ScrollListGallery);
