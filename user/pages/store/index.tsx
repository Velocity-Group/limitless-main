import {
  Layout, Button, message, Spin, Modal, Avatar, Tooltip, Image
} from 'antd';
import PageHeading from '@components/common/page-heading';
import {
  BookOutlined, DollarOutlined, ShopOutlined
} from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import Link from 'next/link';
import Error from 'next/error';
import {
  productService, tokenTransctionService, reactionService, utilsService
} from '@services/index';
import { PerformerListProduct } from '@components/product/performer-list-product';
import { PurchaseProductForm } from '@components/product/confirm-purchase';
import { updateBalance } from '@redux/user/actions';
import {
  IProduct, IUser, IUIConfig, IError, ICountry
} from 'src/interfaces';
import Router from 'next/router';
import './store.less';

interface IProps {
  user: IUser;
  ui: IUIConfig;
  error: IError;
  updateBalance: Function;
  product: IProduct;
  countries: ICountry[];
}

interface IStates {
  isBookmarked: boolean;
  relatedProducts: IProduct[];
  loading: boolean;
  submiting: boolean;
  openPurchaseModal: boolean;
}

class ProductViewPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static noredirect = true;

  static async getInitialProps({ ctx }) {
    const { query } = ctx;
    try {
      const [product, countries] = await Promise.all([
        productService.userView(query.id, {
          Authorization: ctx.token
        }),
        utilsService.countriesList()
      ]);
      return {
        product: product.data,
        countries: countries.data
      };
    } catch (e) {
      return { error: await e };
    }
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      relatedProducts: [],
      loading: false,
      submiting: false,
      isBookmarked: false,
      openPurchaseModal: false
    };
  }

  componentDidMount() {
    this.updateProductShallowRoute();
  }

  async componentDidUpdate(prevProps) {
    const { product } = this.props;
    if (prevProps?.product?._id !== product?._id) {
      this.updateProductShallowRoute();
    }
  }

  async handleBookmark() {
    const { isBookmarked } = this.state;
    const { product } = this.props;
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

  async updateProductShallowRoute() {
    const { product } = this.props;
    try {
      await this.setState({ loading: true });
      const relatedProducts = await (await productService.userSearch({
        limit: 24,
        excludedId: product._id,
        performerId: product.performerId
      })).data;
      this.setState({
        isBookmarked: product.isBookMarked,
        relatedProducts: relatedProducts.data,
        loading: false
      });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
      this.setState({ loading: false });
    }
  }

  async purchaseProduct(payload: any) {
    const { user, updateBalance: handleUpdateBalance, product } = this.props;
    if (user?.isPerformer) return;
    if (user.balance < product.price) {
      message.error('You have an insufficient token balance. Please top up.');
      return;
    }
    if (product.type === 'physical' && !payload.deliveryAddressId) {
      message.error('Please select or create new the delivery address!');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await tokenTransctionService.purchaseProduct(product._id, payload);
      message.success('Payment success');
      handleUpdateBalance({ token: -product.price });
      Router.push('/user/orders');
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
      this.setState({ submiting: false, openPurchaseModal: false });
    }
  }

  render() {
    const {
      ui, product, error, user, countries
    } = this.props;
    if (error) {
      return <Error statusCode={error?.statusCode || 404} title={error?.message || 'Product was not found'} />;
    }
    const {
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
            {`${ui?.siteName} | ${product?.name || 'Product'}`}
          </title>
          <meta name="keywords" content={product?.description} />
          <meta name="description" content={product?.description} />
          {/* OG tags */}
          <meta
            property="og:title"
            content={`${ui?.siteName} | ${product?.name || 'Product'}`}
            key="title"
          />
          <meta property="og:image" content={product?.image || '/static/empty_product.svg'} />
          <meta
            property="og:description"
            content={product?.description}
          />
          {/* Twitter tags */}
          <meta
            name="twitter:title"
            content={`${ui.siteName} | ${product.name || 'Product'}`}
          />
          <meta name="twitter:image" content={product?.image || '/static/empty_product.svg'} />
          <meta
            name="twitter:description"
            content={product.description}
          />
        </Head>
        <div className="main-container">
          <PageHeading title={product.name || 'N/A'} icon={<ShopOutlined />} />
          <div className="prod-card">
            {product && !loading ? (
              <div className="prod-img">
                <Image
                  alt="product-img"
                  src={product?.image || '/static/empty_product.svg'}
                />
                {product.stock && product.type === 'physical' ? (
                  <span className="prod-stock">
                    {product.stock}
                    {' '}
                    in stock
                  </span>
                ) : null}
                {!product.stock && product.type === 'physical' && (
                  <span className="prod-stock">Out of stock!</span>
                )}
                {product.type === 'digital' && <span className="prod-digital">Digital</span>}
              </div>
            ) : <div className="text-center"><Spin /></div>}
            {product && (
              <div className="prod-info">
                <p className="prod-desc">{product?.description || 'No description yet'}</p>
                <div className="add-cart">
                  <p className="prod-price">
                    $
                    {product.price.toFixed(2)}
                  </p>
                  <div>
                    <Button
                      className="primary"
                      disabled={loading}
                      onClick={() => {
                        if (!user?._id) {
                          message.error('Please log in or register!');
                          return;
                        }
                        if (user?.isPerformer) {
                          message.error('Models cannot purchase theirs own products!');
                          return;
                        }
                        if (product?.type === 'physical' && !product?.stock) {
                          message.error('Out of stock, please comeback later!');
                          return;
                        }
                        this.setState({ openPurchaseModal: true });
                      }}
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
        <div className="vid-split">
          <div className="main-container">
            <div className="vid-act">
              <div className="o-w-ner">
                <Link
                  href={{
                    pathname: '/model/profile',
                    query: { username: product?.performer?.username || product?.performer?._id }
                  }}
                  as={`/model/${product?.performer?.username || product?.performer?._id}`}
                >
                  <a>
                    <Avatar
                      alt="performer avatar"
                      src={product?.performer?.avatar || '/static/no-avatar.png'}
                    />
                    <div className="owner-name">
                      <div className="name">
                        {product?.performer?.name || 'N/A'}
                        {' '}
                        {product?.performer?.verifiedAccount && <TickIcon />}
                      </div>
                      <small>
                        @
                        {product?.performer?.username || 'n/a'}
                      </small>
                    </div>
                  </a>
                </Link>
              </div>
              <div className="act-btns">
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
          key="purchase-product"
          width={660}
          title={null}
          visible={openPurchaseModal}
          onOk={() => this.setState({ openPurchaseModal: false })}
          footer={null}
          onCancel={() => this.setState({ openPurchaseModal: false })}
          destroyOnClose
          centered
        >
          <PurchaseProductForm
            countries={countries}
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
