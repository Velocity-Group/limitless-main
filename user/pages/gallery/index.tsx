import { PureComponent } from 'react';
import {
  Layout, message, Row, Col, Spin, Tabs
} from 'antd';
import {
  HeartOutlined, BookOutlined
} from '@ant-design/icons';
import { connect } from 'react-redux';
import Head from 'next/head';
import { galleryService, photoService } from '@services/index';
import { getRelatedGalleries } from '@redux/gallery/actions';
import {
  IGallery,
  IUser,
  IUIConfig
} from 'src/interfaces';
import GalleryCard from '@components/gallery/gallery-card';
import { Carousel } from 'react-responsive-carousel';
import Router from 'next/router';
import Link from 'next/link';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import './index.less';

interface IProps {
  gallery: IGallery;
  query: any;
  user: IUser;
  ui: IUIConfig;
  getRelatedGalleries: Function;
  relatedGalleries: any;
}

class GalleryViewPage extends PureComponent<IProps> {
  static authenticate: boolean = true;

  subscriptionType = 'monthly';

  static async getInitialProps({ ctx }) {
    const { query } = ctx;
    try {
      const gallery = (await (
        await galleryService.userViewDetails(query.id, {
          Authorization: ctx.token
        })
      ).data) as IGallery;
      if (gallery) {
        return {
          gallery
        };
      }
    } catch (e) {
      return { };
    }
    return { };
  }

  state = {
    fetching: false,
    photos: []
  };

  async componentDidMount() {
    const { gallery, getRelatedGalleries: getRelatedHandler } = this.props;
    if (!gallery || !gallery._id) {
      Router.back();
      return;
    }
    this.getPhotos();
    getRelatedHandler({
      performerId: gallery.performerId,
      excludedId: gallery._id,
      status: 'active',
      limit: 24
    });
  }

  componentDidUpdate(prevProps) {
    const { gallery, getRelatedGalleries: getRelatedHandler } = this.props;
    if (prevProps?.gallery?._id !== gallery?._id) {
      getRelatedHandler({
        performerId: gallery.performerId,
        excludedId: gallery._id,
        status: 'active',
        limit: 24
      });
    }
  }

  async getPhotos() {
    const { gallery } = this.props;
    try {
      await this.setState({ fetching: true });
      const resp = await (await photoService.searchPhotosInGallery({ galleryId: gallery._id, limit: 999 })).data;
      this.setState({ photos: resp.data });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error on getting photos, please try again later');
    } finally {
      this.setState({ fetching: false });
    }
  }

  render() {
    const {
      ui,
      gallery,
      relatedGalleries = {
        requesting: false,
        error: null,
        success: false,
        items: []
      }
    } = this.props;
    const { fetching, photos } = this.state;

    return (
      <>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {gallery?.title || 'Gallery'}
          </title>
          <meta name="keywords" content={gallery?.description} />
          <meta name="description" content={gallery?.description} />
          {/* OG tags */}
          <meta
            property="og:title"
            content={
              ui
              && `${ui.siteName} | ${gallery?.title || 'Gallery'}`
            }
            key="title"
          />
          <meta property="og:image" content={gallery?.coverPhoto?.thumbnails[0] || gallery?.coverPhoto?.url} />
          <meta property="og:keywords" content={gallery?.description} />
          <meta
            property="og:description"
            content={gallery?.description}
          />
        </Head>
        <Layout>
          <div className="main-container">
            <div className="page-heading">{gallery?.title}</div>
            <p>{gallery?.description}</p>
            <div className="photo-carousel">
              <Carousel>
                {photos.length > 0 && photos.map((photo) => (
                  <img alt="img" src={gallery?.isSubscribed ? photo?.photo?.url : '/static/no-subscribe-img.jpg'} key={photo._id} />
                ))}
              </Carousel>
              {!fetching && !photos.length && <p className="text-center">No photo was found.</p>}
              {fetching && <div className="text-center"><Spin /></div>}
            </div>
          </div>
          <div className="vid-split">
            <div className="main-container">
              <div className="vid-act">
                <div className="act-btns">
                  <button
                    type="button"
                    className="react-btn"
                  >
                    <HeartOutlined />
                  </button>
                  <button
                    type="button"
                    className="react-btn"
                  >
                    <BookOutlined />
                  </button>
                </div>
                <div className="o-w-ner">
                  <Link
                    href={{
                      pathname: '/model/profile',
                      query: { username: gallery.performer?.username }
                    }}
                    as={`/model/${gallery.performer?.username}`}
                  >
                    <>
                      <img
                        alt="performer avatar"
                        src={gallery.performer?.avatar || '/user.png'}
                      />
                      {' '}
                      <div className="owner-name">
                        <div>{gallery?.performer?.name || 'N/A'}</div>
                        <small>
                          @
                          {gallery?.performer?.username || 'n/a'}
                        </small>
                      </div>
                    </>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="vid-info">
            <div className="main-container">
              <Tabs
                defaultActiveKey="Description"
              >
                <Tabs.TabPane tab="Description" key="description">
                  <p>{gallery.description || 'No description...'}</p>
                </Tabs.TabPane>
              </Tabs>
            </div>
          </div>
          <div className="main-container">
            <div className="related-items">
              <h4 className="ttl-1">You may also like</h4>
              {relatedGalleries.requesting && <div className="text-center"><Spin /></div>}
              <Row>
                {!relatedGalleries.requesting && relatedGalleries.items.length > 0
                  && relatedGalleries.items.map((item: IGallery) => (
                    <Col xs={12} sm={12} md={6} lg={6} key={item._id}>
                      <GalleryCard gallery={item} />
                    </Col>
                  ))}
              </Row>
            </div>
          </div>
        </Layout>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  user: { ...state.user.current },
  ui: { ...state.ui },
  relatedGalleries: { ...state.gallery.relatedGalleries }
});

const mapDispatch = {
  getRelatedGalleries
};
export default connect(mapStates, mapDispatch)(GalleryViewPage);
