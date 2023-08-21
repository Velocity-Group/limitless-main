import { Image } from 'antd';
import Link from 'next/link';
import { IProduct } from 'src/interfaces';
import './index.less';
import { IntlShape, useIntl } from 'react-intl';

interface IProps {
  product: IProduct
}

const CardProductTrending = ({ product }: IProps) => {
  const image = product?.image || '/static/no-image.jpg';
  const intl: IntlShape = useIntl();

  return (
    <div className="product-trending-grid-card" key={product._id}>
      <Link
        href={{ pathname: '/store', query: { id: product.slug || product._id } }}
        as={`/store/${product.slug || product._id}`}
      >
        <div className="card-trending-thumb">
          {/* eslint-disable-next-line no-nested-ternary */}
          <div className="trending-card-bg" style={{ backgroundImage: `url(${image})` }} />
          {product.price > 0 && (
            <div className="trending-bagde">
              <p className="trending-category-bg">
                $
                {' '}
                {(product.price || 0).toFixed(2)}
              </p>
            </div>
          )}
          {!product.stock && product.type === 'physical' && (
            <div className="product-bagde-red">
              <p className="product-bg-red">
                {intl.formatMessage({ id: 'outOfStock', defaultMessage: 'Out of stock' })}
                !
              </p>
            </div>
          )}
          {product.stock > 0 && product.type === 'physical' && (
            <div className="product-bagde-red">
              <p className="product-bg-red">
                {product.stock}
                {' '}
                {intl.formatMessage({ id: 'stock', defaultMessage: 'Stock' })}
              </p>
            </div>
          )}
          <div className="card-bottom">
            <div className="stats-profile">
              <Image
                preview={false}
                alt="main-avt"
                src={product.performer?.avatar || '/static/no-avatar.png'}
                fallback="/static/no-avatar.png"
              />
              <h5>{product.performer.username || 'n/a'}</h5>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CardProductTrending;
