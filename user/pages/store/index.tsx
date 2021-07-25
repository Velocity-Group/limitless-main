import {
  Layout, Button, message, Spin, Modal, Tooltip
} from 'antd';
import PageHeading from '@components/common/page-heading';
import {
  BookOutlined, DollarOutlined, HeartOutlined, ShopOutlined
} from '@ant-design/icons';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import Link from 'next/link';
import { productService, purchaseTokenService, reactionService } from '@services/index';
import { PerformerListProduct } from '@components/product/performer-list-product';
import { PurchaseProductForm } from '@components/product/confirm-purchase';
import { updateBalance } from '@redux/user/actions';
import { IProduct, IUser, IUIConfig } from '../../src/interfaces';
import './store.less';

interface IProps {
  user: IUser;
  ui: IUIConfig;
  id: string;
  updateBalance: Function;
}

interface IStates {
  isBookmarked: boolean;
  product: IProduct;
  relatedProducts: IProduct[];
  loading: boolean;
  submiting: boolean;
  openPurchaseModal: boolean;
}

class ProductViewPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static noredirect = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      product: null,
      relatedProducts: [],
      loading: false,
      submiting: false,
      isBookmarked: false,
      openPurchaseModal: false
    };
  }

  async componentDidMount() {
    await this.getProduct();
  }

  async componentDidUpdate(prevProps) {
    const { id } = this.props;
    if (prevProps.id !== id) {
      this.getProduct();
    }
  }

  async handleBookmark() {
    const { isBookmarked, product } = this.state;
    try {
      await this.setState({ submiting: true });
      if (!isBookmarked) {
        await reactionService.create({
          objectId: product._id,
          action: 'book_mark',
          objectType: 'product'
        });
        this.setState({ isBookmarked: true });
      } else {
        await reactionService.delete({
          objectId: product._id,
          action: 'book_mark',
          objectType: 'product'
        });
        this.setState({ isBookmarked: false });
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
    } finally {
      await this.setState({ submiting: false });
    }
  }

  async getProduct() {
    const { id } = this.props;
    try {
      await this.setState({ loading: true });
      const product = (await (await productService.userView(id))
        .data) as IProduct;
      if (product) {
        await this.setState({ product });
        if (product.isBookMarked) {
          await this.setState({ isBookmarked: true });
        }
        const relatedProducts = await (await productService.userSearch({
          limit: 24,
          excludedId: product._id,
          performerId: product.performerId
        })
        ).data;
        this.setState({
          relatedProducts: relatedProducts.data
        });
      }
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ loading: false });
    }
  }

  async purchaseProduct(payload: any) {
    const { user, updateBalance: handleUpdateBalance } = this.props;
    const { product } = this.state;
    if (user.balance < product.price) {
      message.error('Your token balance is not enough');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await purchaseTokenService.purchaseProduct(product._id, payload);
      message.success('Payment success, please check on Order page for newest product status');
      handleUpdateBalance({ token: -product.price });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false, openPurchaseModal: false });
    }
  }

  render() {
    const { ui } = this.props;
    const {
      product,
      relatedProducts,
      isBookmarked,
      loading,
      openPurchaseModal,
      submiting
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {product && product.name}
          </title>
        </Head>
        <div className="prod-main">
          <div className="main-container">
            <div className="prod-card">
              {product && !loading ? (
                <div className="prod-img">
                  <img
                    alt="product-img"
                    src={product?.image || '/static/empty_product.svg'}
                  />
                  {product.stock && product.type === 'physical' && (
                  <span className="prod-stock">
                    {product.stock}
                    {' '}
                    in stock
                  </span>
                  )}
                  {!product.stock && product.type === 'physical' && (
                  <span className="prod-stock">Out of stock!</span>
                  )}
                  <span className="prod-digital">{product.type}</span>
                </div>
              ) : <div><Spin /></div>}
              {product && (
              <div className="prod-info">
                <PageHeading title={product.name || 'N/A'} icon={<ShopOutlined />} />
                <p className="prod-desc">{product?.description}</p>
                <div className="add-cart">
                  <p className="prod-price">
                    <img alt="coin" src="/static/coin-ico.png" width="25px" />
                    {product.price.toFixed(2)}
                  </p>
                  <div>
                    <Button
                      className="primary"
                      disabled={loading}
                      onClick={() => this.setState({ openPurchaseModal: true })}
                    >
                      <DollarOutlined />
                      Get it now!
                    </Button>
                  </div>
                </div>
              </div>
              )}
            </div>
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
                <Tooltip title={isBookmarked ? 'Remove from Bookmarks' : 'Add to Bookmarks'}>
                  <button
                    type="button"
                    className={isBookmarked ? 'react-btn active' : 'react-btn'}
                    disabled={submiting}
                    onClick={this.handleBookmark.bind(this)}
                  >
                    <BookOutlined />
                  </button>
                </Tooltip>
              </div>
              <div className="o-w-ner">
                <Link
                  href={{
                    pathname: '/model/profile',
                    query: { username: product?.performer?.username || product?.performer?._id }
                  }}
                  as={`/model/${product?.performer?.username || product?.performer?._id}`}
                >
                  <>
                    <img
                      alt="performer avatar"
                      src={product?.performer?.avatar || '/static/no-avatar.png'}
                    />
                    {' '}
                    <div className="owner-name">
                      <div>{product?.performer?.name || 'N/A'}</div>
                      <small>
                        @
                        {product?.performer?.username || 'n/a'}
                      </small>
                    </div>
                  </>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="main-container">
          <div className="related-items">
            <h4 className="ttl-1">You may also like</h4>
            {!loading && relatedProducts.length > 0 && (
            <PerformerListProduct products={relatedProducts} />
            )}
            {!loading && !relatedProducts.length && <p>No product was found</p>}
            {loading && <div style={{ margin: 10, textAlign: 'center' }}><Spin /></div>}
          </div>
        </div>
        <Modal
          key="tip_performer"
          title={`Confirm purchase ${product?.name}`}
          visible={openPurchaseModal}
          onOk={() => this.setState({ openPurchaseModal: false })}
          footer={null}
          onCancel={() => this.setState({ openPurchaseModal: false })}
          destroyOnClose
        >
          <PurchaseProductForm
            product={product}
            submiting={submiting}
            onFinish={this.purchaseProduct.bind(this)}
          />
        </Modal>
      </Layout>
    );
  }
}
const mapStates = (state: any) => ({
  user: state.user.current,
  ui: { ...state.ui }
});

const mapDispatch = { updateBalance };
export default connect(mapStates, mapDispatch)(ProductViewPage);
