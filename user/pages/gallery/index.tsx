import { PureComponent } from 'react';
import {
  Layout, message, Row, Col, Spin, Button, Modal, Tabs, Avatar, Tooltip
} from 'antd';
import {
  EyeOutlined, PictureOutlined, CalendarOutlined, BookOutlined
} from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import { connect } from 'react-redux';
import Head from 'next/head';
import {
  galleryService, photoService, tokenTransactionService, reactionService
} from '@services/index';
import { getRelatedGalleries } from '@redux/gallery/actions';
import { updateBalance } from '@redux/user/actions';
import {
  IGallery, IUser, IUIConfig
} from 'src/interfaces';
import { setSubscription } from '@redux/subscription/actions';
import { PurchaseGalleryForm } from '@components/gallery/confirm-purchase';
import GalleryCard from '@components/gallery/gallery-card';
import Router from 'next/router';
import Link from 'next/link';
import Error from 'next/error';
import { shortenLargeNumber, formatDate } from '@lib/index';
import PageHeading from '@components/common/page-heading';
import PhotoPreviewList from '@components/photo/photo-preview-list';
import './index.less';

interface IProps {
  gallery: IGallery;
  error: any;
  user: IUser;
  ui: IUIConfig;
  getRelatedGalleries: Function;
  updateBalance: Function;
  relatedGalleries: any;
  setSubscription: Function;
}

class GalleryViewPage extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  static async getInitialProps({ ctx }) {
    const { query } = ctx;
    try {
      const gallery = (await (
        await galleryService.userViewDetails(query.id, {
          Authorization: ctx.token
        })
      ).data) as IGallery;
      return {
        gallery
      };
    } catch (e) {
      return { error: await e };
    }
  }

  state = {
    offset: 0,
    total: 0,
    fetching: false,
    photos: [],
    isBought: false,
    isBookmarked: false,
    requesting: false,
    openPurchaseModal: false
  };

  componentDidMount() {
    this.handleUpdateState();
  }

  componentDidUpdate(prevProps) {
    const { gallery } = this.props;
    if (prevProps?.gallery?._id !== gallery?._id) {
      this.handleUpdateState();
    }
  }

  async handleBookmark() {
    const { isBookmarked } = this.state;
    const { gallery } = this.props;
    try {
      await this.setState({ requesting: true });
      if (!isBookmarked) {
        await reactionService.create({
          objectId: gallery._id,
          action: 'book_mark',
          objectType: 'gallery'
        });
        this.setState({ isBookmarked: true, requesting: false });
      } else {
        await reactionService.delete({
          objectId: gallery._id,
          action: 'book_mark',
          objectType: 'gallery'
        });
        this.setState({ isBookmarked: false, requesting: false });
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ requesting: false });
    }
  }

  handleUpdateState() {
    const { gallery, getRelatedGalleries: getRelatedHandler } = this.props;
    this.setState({ isBought: gallery.isBought, isBookmarked: gallery.isBookMarked, photos: [] });
    this.getPhotos();
    getRelatedHandler({
      performerId: gallery.performerId,
      excludedId: gallery._id,
      status: 'active',
      limit: 24
    });
  }

  async getPhotos() {
    const { gallery } = this.props;
    const { offset, photos } = this.state;
    try {
      await this.setState({ fetching: true });
      const resp = await (await photoService.userSearch({
        galleryId: gallery._id,
        limit: 40,
        offset: offset * 40
      })).data;
      this.setState({ photos: photos.concat(resp.data), total: resp.total });
      // preload image
      resp.data.forEach((img) => {
        setTimeout(() => { new Image().src = img?.photo?.url; }, 1000);
        return img;
      });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error on getting photos, please try again later');
    } finally {
      this.setState({ fetching: false });
    }
  }

  async getMorePhotos() {
    const { offset } = this.state;
    await this.setState({ offset: offset + 1 });
    this.getPhotos();
  }

  async purchaseGallery() {
    const { gallery, user, updateBalance: handleUpdateBalance } = this.props;
    if (user?.balance < gallery.price) {
      message.error('You have an insufficient token balance. Please top up.');
      Router.push('/wallet');
      return;
    }
    try {
      await this.setState({ requesting: true });
      await (await tokenTransactionService.purchaseGallery(gallery._id, { })).data;
      message.success('Gallery is unlocked!');
      handleUpdateBalance({ token: -gallery.price });
      this.setState({ isBought: true, openPurchaseModal: false, requesting: false });
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ requesting: false });
    }
  }

  render() {
    const {
      ui,
      error,
      gallery,
      user,
      relatedGalleries = {
        requesting: false,
        error: null,
        success: false,
        items: []
      },
      setSubscription: updateSubscription
    } = this.props;
    if (error) {
      return <Error statusCode={error?.statusCode || 404} title={error?.message || 'Galley was not found'} />;
    }
    const {
      fetching, photos, total, isBought, requesting, openPurchaseModal,
      isBookmarked
    } = this.state;
    const canview = (gallery?.isSale && isBought) || (!gallery?.isSale && gallery?.isSubscribed);
    const thumbUrl = gallery?.coverPhoto?.url || ui?.logo;
    return (
      <Layout>
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
          <meta property="og:image" content={thumbUrl} />
          <meta
            property="og:description"
            content={gallery?.description}
          />
          {/* Twitter tags */}
          <meta
            name="twitter:title"
            content={`${ui.siteName} | ${gallery.title || 'Gallery'}`}
          />
          <meta name="twitter:image" content={thumbUrl} />
          <meta
            name="twitter:description"
            content={gallery.description}
          />
        </Head>
        <div className="main-container">
          <PageHeading icon={<PictureOutlined />} title={gallery?.title || 'Gallery'} />
          <div className="gal-stats">
            <a>
              <EyeOutlined />
              &nbsp;
              {shortenLargeNumber(gallery?.stats.views || 0)}
            </a>
            <a>
              <CalendarOutlined />
              &nbsp;
              {formatDate(gallery?.updatedAt, 'll')}
            </a>
          </div>
          <div className="photo-carousel">
            {!fetching && photos && photos.length > 0 && <PhotoPreviewList isBlur={!user || !user._id || !canview} photos={photos} />}
            {!fetching && !photos.length && <p className="text-center">No photo was found.</p>}
            {fetching && <div className="text-center"><Spin /></div>}
            {!fetching && total > photos.length && <div className="text-center" style={{ margin: 10 }}><Button type="link" onClick={this.getMorePhotos.bind(this)}>More photos ...</Button></div>}
            {!canview && (
            <div className="text-center" style={{ margin: '20px 0' }}>
              {gallery?.isSale && !isBought && (
              <Button disabled={!user || !user._id || requesting} className="primary" onClick={() => this.setState({ openPurchaseModal: true })}>
                PAY&nbsp;
                $
                {(gallery?.price || 0).toFixed(2)}
                {' '}
                TO UNLOCK
              </Button>
              )}
              {!gallery?.isSale && !gallery?.isSubscribed && (
              <div
                style={{ padding: '25px 5px' }}
                className="subscription"
              >
                <h3>Subscribe to view full content</h3>
                  {gallery?.performer?.isFreeSubscription && (
                  <Button
                    className="primary"
                    style={{ marginRight: '15px' }}
                    disabled={!user._id}
                    onClick={() => {
                      updateSubscription({ showModal: true, subscriptionType: 'free', performer: gallery?.performer });
                    }}
                  >
                    SUBSCRIBE FOR FREE
                    {' '}
                    {gallery?.performer?.durationFreeSubscriptionDays || 1}
                    {' '}
                    {gallery?.performer?.durationFreeSubscriptionDays > 1 ? 'DAYS' : 'DAY'}
                  </Button>
                  )}
                  {gallery?.performer?.monthlyPrice && (
                  <Button
                    className="primary"
                    style={{ marginRight: '15px' }}
                    disabled={!user._id}
                    onClick={() => {
                      updateSubscription({ showModal: true, subscriptionType: 'monthly', performer: gallery?.performer });
                    }}
                  >
                    MONTHLY SUBSCRIPTION FOR $
                    {(gallery?.performer?.monthlyPrice || 0).toFixed(2)}
                  </Button>
                  )}
                  {gallery?.performer.yearlyPrice && (
                  <Button
                    className="secondary"
                    disabled={!user._id}
                    onClick={() => {
                      updateSubscription({ showModal: true, subscriptionType: 'yearly', performer: gallery?.performer });
                    }}
                  >
                    YEARLY SUBSCRIPTION FOR $
                    {(gallery?.performer?.yearlyPrice || 0).toFixed(2)}
                  </Button>
                  )}
              </div>
              )}
            </div>
            )}
          </div>
        </div>
        <div className="vid-split">
          <div className="main-container">
            <div className="vid-act">
              <Link
                href={{
                  pathname: '/model/profile',
                  query: { username: gallery?.performer?.username || gallery?.performer?._id }
                }}
                as={`/${gallery?.performer?.username || gallery?.performer?._id}`}
              >
                <a>
                  <div className="o-w-ner">
                    <Avatar
                      alt="performer avatar"
                      src={gallery?.performer?.avatar || '/static/no-avatar.png'}
                    />
                    <div className="owner-name">
                      <div className="name">
                        {gallery?.performer?.name || 'N/A'}
                        {gallery?.performer?.verifiedAccount && <TickIcon />}
                      </div>
                      <small>
                        @
                        {gallery?.performer?.username || 'n/a'}
                      </small>
                    </div>
                  </div>
                </a>
              </Link>
              <div className="act-btns">
                <Tooltip title={isBookmarked ? 'Remove from Bookmarks' : 'Add to Bookmarks'}>
                  <button
                    type="button"
                    className={isBookmarked ? 'react-btn active' : 'react-btn'}
                    disabled={requesting}
                    onClick={this.handleBookmark.bind(this)}
                  >
                    <BookOutlined />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
        <div className="main-container">
          <Tabs
            defaultActiveKey="description"
          >
            <Tabs.TabPane tab="Description" key="description">
              <p>{gallery?.description || 'No description...'}</p>
            </Tabs.TabPane>
          </Tabs>
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
          centered
          key="purchase_post"
          title={null}
          visible={openPurchaseModal}
          footer={null}
          onCancel={() => this.setState({ openPurchaseModal: false })}
        >
          <PurchaseGalleryForm gallery={gallery} submiting={requesting} onFinish={this.purchaseGallery.bind(this)} />
        </Modal>

      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  user: { ...state.user.current },
  ui: { ...state.ui },
  relatedGalleries: { ...state.gallery.relatedGalleries },
  settings: { ...state.settings }
});

const mapDispatch = {
  getRelatedGalleries,
  updateBalance,
  setSubscription
};
export default connect(mapStates, mapDispatch)(GalleryViewPage);
