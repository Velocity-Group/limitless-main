import {
  Layout, Button, message, Spin, Modal
} from 'antd';
import { BookOutlined, DollarOutlined } from '@ant-design/icons';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import { productService, reactionService } from '@services/index';
import { PerformerListProduct } from '@components/product/performer-list-product';
import { addCart, removeCart } from '@redux/cart/actions';
import { PurchaseProductForm } from '@components/product/confirm-purchase';
import { IProduct, IUser, IUIConfig } from '../../src/interfaces';
import './store.less';

interface IProps {
  user: IUser;
  ui: IUIConfig;
  id: string;
}

interface IStates {
  isAlreadyBookMarked: boolean;
  product: IProduct;
  relatedProducts: IProduct[];
  loading: boolean;
  submiting: boolean;
  openPurchaseModal: boolean;
}

class ProductViewPage extends PureComponent<IProps, IStates> {
  static authenticate: boolean = true;

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
      isAlreadyBookMarked: false,
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

  async handleBookmark(item: IProduct) {
    const { isAlreadyBookMarked } = this.state;
    try {
      await this.setState({ loading: true });
      if (!isAlreadyBookMarked) {
        await reactionService.create({
          objectId: item._id,
          action: 'book_mark',
          objectType: 'product'
        });
        this.setState({ isAlreadyBookMarked: true });
      } else {
        await reactionService.delete({
          objectId: item._id,
          action: 'book_mark',
          objectType: 'product'
        });
        this.setState({ isAlreadyBookMarked: false });
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
    } finally {
      await this.setState({ loading: false });
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
          await this.setState({ isAlreadyBookMarked: true });
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

  async purchaseProduct() {
    const { user } = this.props;
    const { product } = this.state;
    if (user.balance < product.price) {
      message.error('Your token balance is not enough');
      return;
    }
    try {
      await this.setState({ submiting: true });
      // const resp = await
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  render() {
    const { ui } = this.props;
    const {
      product,
      relatedProducts,
      isAlreadyBookMarked,
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
                <div className="prod-name">{product?.name}</div>
                <p className="prod-desc">{product?.description}</p>
                <div className="add-cart">
                  <p className="prod-price">
                    <img alt="coin" src="/static/coin-ico.png" width="20px" />
                    &nbsp;
                    {product.price.toFixed(2)}
                  </p>
                  <div>
                    <Button
                      className="primary"
                      disabled={loading}
                      onClick={() => this.setState({ openPurchaseModal: true })}
                    >
                      <DollarOutlined />
                      Buy now!
                    </Button>
                    <Button
                      className={isAlreadyBookMarked ? 'primary' : 'secondary'}
                      disabled={loading}
                      onClick={this.handleBookmark.bind(this, product)}
                    >
                      <BookOutlined />
                      {isAlreadyBookMarked
                        ? 'Remove from Bookmark'
                        : 'Add to Bookmark'}
                    </Button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
        <div className="main-container">
          <div className="related-prod">
            <h4 className="ttl-1">You may also like</h4>
            {!loading && relatedProducts.length > 0 && (
            <PerformerListProduct products={relatedProducts} />
            )}
            {!loading && !relatedProducts.length && <p>No data was found</p>}
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

const mapDispatch = { addCart, removeCart };
export default connect(mapStates, mapDispatch)(ProductViewPage);
