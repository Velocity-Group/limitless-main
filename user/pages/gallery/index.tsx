import { PureComponent } from 'react';
import {
  Layout, message, Row, Col, Spin, Button, Modal
} from 'antd';
import {
  HeartOutlined, BookOutlined, PictureOutlined
} from '@ant-design/icons';
import { connect } from 'react-redux';
import Head from 'next/head';
import {
  galleryService, paymentService, photoService, purchaseTokenService
} from '@services/index';
import { getRelatedGalleries } from '@redux/gallery/actions';
import { updateBalance } from '@redux/user/actions';
import {
  IGallery, IUser, IUIConfig
} from 'src/interfaces';
import { ConfirmSubscriptionPerformerForm } from '@components/performer';
import { PurchaseGalleryForm } from '@components/gallery/confirm-purchase';
import GalleryCard from '@components/gallery/gallery-card';
import Router from 'next/router';
import Link from 'next/link';
import Loader from '@components/common/base/loader';
import PageHeading from '@components/common/page-heading';
import PhotoPreviewList from '@components/photo/photo-preview-list';
import './index.less';

interface IProps {
  gallery: IGallery;
  query: any;
  user: IUser;
  ui: IUIConfig;
  getRelatedGalleries: Function;
  updateBalance: Function;
  relatedGalleries: any;
}

class GalleryViewPage extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

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
    photos: [],
    isBought: false,
    isSubscribed: false,
    submiting: false,
    openPurchaseModal: false,
    openSubscriptionModal: false
  };

  async componentDidMount() {
    const { gallery, getRelatedGalleries: getRelatedHandler } = this.props;
    if (!gallery || !gallery._id) {
      Router.back();
      return;
    }
    this.setState({ isBought: gallery.isBought, isSubscribed: gallery.isSubscribed });
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
      const resp = await (await photoService.userSearch(gallery.performerId, { galleryId: gallery._id, limit: 999 })).data;
      this.setState({ photos: resp.data });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error on getting photos, please try again later');
    } finally {
      this.setState({ fetching: false });
    }
  }

  async purchaseGallery() {
    const { gallery, user, updateBalance: handleUpdateBalance } = this.props;
    if (user?.balance < gallery.price) {
      message.error('Your balance token is not enough');
      Router.push('/token-package');
      return;
    }
    try {
      await (await purchaseTokenService.purchaseGallery(gallery._id, { })).data;
      message.success('Gallery is unlocked!');
      handleUpdateBalance({ token: gallery.price });
      this.setState({ isBought: true, openPurchaseModal: false });
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
    }
  }

  async subscribe() {
    try {
      const { gallery, user } = this.props;
      if (!user._id) {
        message.error('Please log in');
        Router.push('/auth/login');
        return;
      }
      if (!user.stripeCardIds || !user.stripeCardIds.length) {
        message.error('Please add payment card');
        Router.push('/user/cards');
        return;
      }
      await this.setState({ submiting: true });
      await paymentService.subscribePerformer({
        type: this.subscriptionType,
        performerId: gallery.performerId,
        paymentGateway: 'stripe',
        stripeCardId: user.stripeCardIds[0]
      });
      this.setState({ openSubscriptionModal: false });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
      this.setState({ openSubscriptionModal: false, submiting: false });
    }
  }

  render() {
    const {
      ui,
      gallery,
      user,
      relatedGalleries = {
        requesting: false,
        error: null,
        success: false,
        items: []
      }
    } = this.props;
    const {
      fetching, photos, isBought, isSubscribed, submiting, openPurchaseModal, openSubscriptionModal
    } = this.state;
    const canview = (gallery.isSale && isBought) || (!gallery.isSale && isSubscribed);
    return (
      <>
        <Head>
          <title>
            {`${ui?.siteName} | ${gallery?.title || 'Gallery'}`}
          </title>
          <meta name="keywords" content={gallery?.description} />
          <meta name="description" content={gallery?.description} />
          {/* OG tags */}
          <meta
            property="og:title"
            content={`${ui?.siteName} | ${gallery?.title || 'Gallery'}`}
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
            <PageHeading icon={<PictureOutlined />} title={gallery?.title} />
            <p style={{ whiteSpace: 'pre-line' }}>{gallery.description || 'No description'}</p>
            <div className="photo-carousel">
              {!fetching && photos && photos.length > 0 && <PhotoPreviewList isBlur={!user || !user._id || !canview} photos={photos} />}
              {!canview && (
                <div className="text-center" style={{ margin: '20px 0' }}>
                  {gallery.isSale && !isBought && (
                  <Button className="primary" onClick={() => this.setState({ openPurchaseModal: true })}>
                    UNLOCK CONTENT BY
                    {' '}
                    <img alt="coin" src="/static/coin-ico.png" width="20px" />
                    {' '}
                    {(gallery.price || 0).toFixed(2)}
                  </Button>
                  )}
                  {!gallery.isSale && !isSubscribed && (
                  <div
                    style={{ padding: '25px 5px' }}
                    className="subscription"
                  >
                    <h3>To view full content, subscribe me!</h3>
                    <div style={{ marginBottom: '25px' }}>
                      {gallery?.performer?.isFreeSubscription && (
                      <Button
                        className="primary"
                        style={{ marginRight: '15px' }}
                        disabled={submiting && this.subscriptionType === 'free'}
                        onClick={() => {
                          this.subscriptionType = 'free';
                          this.setState({ openSubscriptionModal: true });
                        }}
                      >
                        SUBSCRIBE FOR FREE
                      </Button>
                      )}
                      {!gallery?.performer?.isFreeSubscription && gallery?.performer?.monthlyPrice && (
                      <Button
                        className="primary"
                        style={{ marginRight: '15px' }}
                        disabled={submiting && this.subscriptionType === 'monthly'}
                        onClick={() => {
                          this.subscriptionType = 'monthly';
                          this.setState({ openSubscriptionModal: true });
                        }}
                      >
                        MONTHLY SUBSCRIPTION BY $
                        {(gallery?.performer?.monthlyPrice || 0).toFixed(2)}
                      </Button>
                      )}
                      {!gallery?.performer?.isFreeSubscription && gallery?.performer.yearlyPrice && (
                      <Button
                        className="btn btn-yellow"
                        disabled={submiting && this.subscriptionType === 'yearly'}
                        onClick={() => {
                          this.subscriptionType = 'yearly';
                          this.setState({ openSubscriptionModal: true });
                        }}
                      >
                        YEARLY SUBSCRIPTON BY
                        {(gallery?.performer?.yearlyPrice || 0).toFixed(2)}
                      </Button>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              )}
              {!fetching && !photos.length && <p className="text-center">No photo was found.</p>}
              {fetching && <div className="text-center"><Spin /></div>}
            </div>
          </div>
          <div className="vid-split">
            <div className="main-container">
              <div className="vid-act">
                <Link
                  href={{
                    pathname: '/model/profile',
                    query: { username: gallery.performer?.username || gallery.performer?._id }
                  }}
                  as={`/model/${gallery.performer?.username || gallery.performer?._id}`}
                >
                  <a>
                    <div className="o-w-ner">
                      <img
                        alt="performer avatar"
                        src={gallery.performer?.avatar || '/static/no-avatar.png'}
                      />
                      {' '}
                      <div className="owner-name">
                        <div>{gallery?.performer?.name || 'N/A'}</div>
                        <small>
                          @
                          {gallery?.performer?.username || 'n/a'}
                        </small>
                      </div>
                    </div>
                  </a>
                </Link>
                {/* <div className="act-btns">
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
                </div> */}
              </div>
            </div>
          </div>
          <div className="main-container">
            <div className="related-items">
              <h4 className="ttl-1">You may also like</h4>
              {relatedGalleries.requesting && <div className="text-center"><Spin /></div>}
              {!relatedGalleries.requesting && !relatedGalleries.items.length && <p>No gallery was found</p>}
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
          <Modal
            key="subscribe_performer"
            className="subscription-modal"
            width={500}
            title={null}
            visible={openSubscriptionModal}
            footer={null}
            onCancel={() => this.setState({ openSubscriptionModal: false })}
          >
            <ConfirmSubscriptionPerformerForm
              type={this.subscriptionType || 'monthly'}
              performer={gallery?.performer}
              submiting={submiting}
              onFinish={this.subscribe.bind(this)}
            />
          </Modal>
          <Modal
            key="purchase_post"
            title={`Unlock gallery ${gallery.title}`}
            visible={openPurchaseModal}
            footer={null}
            onCancel={() => this.setState({ openPurchaseModal: false })}
          >
            <PurchaseGalleryForm gallery={gallery} submiting={submiting} onFinish={this.purchaseGallery.bind(this)} />
          </Modal>
          {submiting && <Loader customText="Your payment is on processing, do not reload page until its done" />}
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
  getRelatedGalleries,
  updateBalance
};
export default connect(mapStates, mapDispatch)(GalleryViewPage);
