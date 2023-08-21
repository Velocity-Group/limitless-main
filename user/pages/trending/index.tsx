import {
  Col, Layout, Row, Spin, Tabs, message
} from 'antd';
import './index.less';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import { TabPane } from '@components/common/base/tabs';
import { FilterBar } from '@components/trending/filter-bar';
import { useEffect, useRef, useState } from 'react';
import { trendingService } from '@services/trending.service';
import CardFeedTrending from '@components/trending/card-feed-trending';
import CardVideoTrending from '@components/trending/card-video-trending';
import CardProductTrending from '@components/trending/card-product-trending';
import CardPhotoTrending from '@components/trending/card-photo-trending';
import { IntlShape, useIntl } from 'react-intl';

function TrendingPage() {
  const ui = useSelector((state: any) => state.ui);
  const data = useRef<any>([]);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState({} as any);
  const [listTrending, setListTrending] = useState([]);
  const [isTab, setIsTab] = useState('');
  const intl: IntlShape = useIntl();

  const handelFilter = (values) => {
    setFilter({ ...filter, ...values });
  };

  const handleSearch = (value: any) => {
    if (value.q === '') {
      setListTrending(data.current);
    } else {
      const listTrendingSearch = (data.current || []).filter((d: any) => ((d.performer.username.includes(value.q))));
      setListTrending(listTrendingSearch);
    }
  };

  const getListTrending = async () => {
    setSearching(true);
    const query = {
      time: filter.time || '',
      source: isTab || ''
    };
    try {
      const resp = await trendingService.search({
        ...query
      });
      setListTrending(resp.data);
      data.current = resp.data;
    } catch (e) {
      const error = await e;
      message.error(error.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    } finally {
      setSearching(false);
    }
  };
  const handleTabSelect = (tab: string) => {
    setIsTab(tab);
  };

  useEffect(() => {
    getListTrending();
  }, [isTab, filter]);

  return (
    <Layout>
      <Head>
        <title>
          {ui && ui.siteName}
          {' '}
          |
          {' '}
          {intl.formatMessage({ id: 'trending', defaultMessage: 'Trending' })}
        </title>
      </Head>
      <div className="trending-page">
        {/* <!---Start-Hero-Banner-Section---> */}
        <div className="banner-section">
          <div className="banner-relative">
            <img src="/static/bg-img.png" alt="" className="banner-img " />
            <img src="/static/mobile-bg.jpg" alt="" className="mobile-img" />
          </div>
          <div className="banner-heading">
            <h1 className="hero-title">
              <span className="color-light-blue">#</span>
              {intl.formatMessage({ id: 'trending', defaultMessage: 'Trending' })}
              {' '}
              -
              {' '}
              {intl.formatMessage({ id: 'hotPicksForYou', defaultMessage: 'Hot Picks for You' })}
            </h1>
          </div>
        </div>
        {/* <!---End-Hero-Banner-Section---> */}

        {/* <!---Start-Filtering-Section---> */}
        <div className="filtering-section">
          <div className="tabs-bar">
            <FilterBar onFilter={handelFilter} onSearch={handleSearch} searching={searching} />
            <Tabs defaultActiveKey="" onTabClick={handleTabSelect}>
              <TabPane tab={intl.formatMessage({ id: 'all', defaultMessage: 'All' })} key="">
                <Row>
                  {listTrending.length > 0
                    && listTrending.map((item) => (
                      <Col xs={24} sm={12} md={8} lg={6}>
                        {item.trendingSource === 'feed' && <CardFeedTrending feed={item} key={item._id} />}
                        {item.trendingSource === 'video' && <CardVideoTrending video={item} key={item._id} />}
                        {item.trendingSource === 'gallery' && <CardPhotoTrending gallery={item} key={item._id} />}
                        {item.trendingSource === 'product' && <CardProductTrending product={item} key={item._id} />}
                      </Col>
                    ))}
                </Row>
                {!searching && !listTrending.length && (
                  <p style={{ textAlign: 'center' }}>{intl.formatMessage({ id: 'noTrendingWasFound', defaultMessage: 'No trending was found' })}</p>
                )}
                {searching && <div className="text-center"><Spin /></div>}
              </TabPane>
              <TabPane tab={intl.formatMessage({ id: 'photos', defaultMessage: 'Photos' })} key="gallery">
                <Row>
                  {listTrending.length > 0
                    && listTrending.map((item) => (
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <CardPhotoTrending gallery={item} key={item._id} />
                      </Col>
                    ))}
                </Row>
                {!searching && !listTrending.length && (
                  <p style={{ textAlign: 'center' }}>{intl.formatMessage({ id: 'noTrendingGalleryWasFound', defaultMessage: 'No trending gallery was found' })}</p>
                )}
                {searching && <div className="text-center"><Spin /></div>}
              </TabPane>
              <TabPane tab={intl.formatMessage({ id: 'videos', defaultMessage: 'Videos' })} key="video">
                <Row>
                  {listTrending.length > 0
                    && listTrending.map((item) => (
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <CardVideoTrending video={item} key={item._id} />
                      </Col>
                    ))}
                </Row>
                {!searching && !listTrending.length && (
                  <p style={{ textAlign: 'center' }}>{intl.formatMessage({ id: 'noTrendingVideoWasFound', defaultMessage: 'No trending video was found' })}</p>
                )}
                {searching && <div className="text-center"><Spin /></div>}
              </TabPane>
              <TabPane tab={intl.formatMessage({ id: 'feeds', defaultMessage: 'Feeds' })} key="feed">
                <Row>
                  {listTrending.length > 0
                    && listTrending.map((item) => (
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <CardFeedTrending feed={item} key={item._id} />
                      </Col>
                    ))}
                </Row>
                {!searching && !listTrending.length && (
                  <p style={{ textAlign: 'center' }}>{intl.formatMessage({ id: 'noTrendingFeedWasFound', defaultMessage: 'No trending feed was found' })}</p>
                )}
                {searching && <div className="text-center"><Spin /></div>}
              </TabPane>
              <TabPane tab={intl.formatMessage({ id: 'products', defaultMessage: 'Products' })} key="product">
                <Row>
                  {listTrending.length > 0
                    && listTrending.map((item) => (
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <CardProductTrending product={item} key={item._id} />
                      </Col>
                    ))}
                </Row>
                {!searching && !listTrending.length && (
                  <p style={{ textAlign: 'center' }}>{intl.formatMessage({ id: 'noTrendingProductWasFound', defaultMessage: 'No trending product was found' })}</p>
                )}
                {searching && <div className="text-center"><Spin /></div>}
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default TrendingPage;
