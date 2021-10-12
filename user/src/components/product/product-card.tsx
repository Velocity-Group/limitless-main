import { PureComponent } from 'react';
import { IProduct } from 'src/interfaces';
import { Tooltip } from 'antd';
import Link from 'next/link';
import './product.less';

interface IProps {
  product: IProduct;
}
interface IStates {
  isBookMarked: boolean;
  requesting: boolean;
}

export class ProductCard extends PureComponent<IProps, IStates> {
  render() {
    const { product } = this.props;
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
                <img alt="token" src="/static/coin-ico.png" width="15px" />
                &nbsp;
                {product.price.toFixed(2)}
              </span>
              )}
              {!product.stock && product.type === 'physical' && (
              <div className="label-wrapper-digital">Out of stock!</div>
              )}
              {product.stock > 0 && product.type === 'physical' && (
              <div className="label-wrapper-digital">
                {product.stock}
                {' '}
                in stock
              </div>
              )}
              {product.type === 'digital' && (
              <span className="label-wrapper-digital">Digital</span>
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
