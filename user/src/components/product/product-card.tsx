import { PureComponent } from 'react';
import { IProduct } from 'src/interfaces';
import { Tooltip } from 'antd';
import Link from 'next/link';
import './product.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  product: IProduct;
  intl: IntlShape
}
interface IStates {
  isBookMarked: boolean;
  requesting: boolean;
}

class ProductCard extends PureComponent<IProps, IStates> {
  render() {
    const { product, intl } = this.props;
    const image = product?.image || '/static/no-image.jpg';
    return (
      <Link
        href={{ pathname: '/store', query: { id: product.slug || product._id } }}
        as={`/store/${product.slug || product._id}`}
      >
        <a>
          <div className="prd-card" style={{ backgroundImage: `url(${image})` }}>
            <div className="label-wrapper">
              {product.price > 0 && (
              <span className="label-wrapper-price">
                $
                {product.price.toFixed(2)}
              </span>
              )}
              {!product.stock && product.type === 'physical' && (
                <div className="label-wrapper-digital">
                  {intl.formatMessage({ id: 'outOfStock', defaultMessage: 'Out of stock' })}
                  !
                </div>
              )}
              {product.stock > 0 && product.type === 'physical' && (
                <div className="label-wrapper-digital">
                  {product.stock}
                  {' '}
                  {intl.formatMessage({ id: 'inStock', defaultMessage: 'in stock' })}
                </div>
              )}
              {product.type === 'digital' && (
                <span className="label-wrapper-digital">{intl.formatMessage({ id: 'digital', defaultMessage: 'Digital' })}</span>
              )}
            </div>
            <Tooltip title={product.name}>
              <div className="prd-info">
                {product.name}
              </div>
            </Tooltip>
          </div>
        </a>
      </Link>
    );
  }
}

export default injectIntl(ProductCard);
