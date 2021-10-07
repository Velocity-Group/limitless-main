import { PureComponent } from 'react';
import { IProduct } from 'src/interfaces';

interface IProps {
  product?: IProduct;
  style?: Record<string, string>;
}

export class ImageProduct extends PureComponent<IProps> {
  render() {
    const { product, style } = this.props;
    const { image } = product;
    const url = image || '/product.png';
    return <img src={url} style={style || { width: 50 }} alt="thumb-prod" />;
  }
}
