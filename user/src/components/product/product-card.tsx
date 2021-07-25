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
    const image = product?.image || '/static/placeholder-image.jpg';
    return (

      <Link
        href={{ pathname: '/store', query: { id: product.slug || product._id } }}
        as={`/store/${product.slug || product._id}`}
      >
        <a>
          <div className="prd-card">
            <div className="label-wrapper">
              {product.price && (
              <span className="label-wrapper-price">
                <img alt="token" src="/static/coin-ico.png" width="15px" />
              &nbsp;
                {product.price.toFixed(2)}
              </span>
              )}
              {!product.stock && product.type === 'physical' && (
              <div className="label-wrapper-digital">Out of stock!</div>
              )}
              {product.stock && product.type === 'physical' && (
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
            <div className="prd-thumb">
              <img alt="img" src={image} />
            </div>
            <div className="prd-info">
              <Tooltip title={product.name}>
                <a>{product.name}</a>
              </Tooltip>
            </div>
          </div>
        </a>
      </Link>
    );
  }
}
