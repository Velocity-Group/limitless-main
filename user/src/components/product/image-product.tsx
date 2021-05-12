import { PureComponent } from 'react';
import { IProduct } from 'src/interfaces';

interface IProps {
  product?: IProduct;
  style?: Record<string, string>;
}

export class ImageProduct extends PureComponent<IProps> {
  render() {
    const { product, style } = this.props;
    const url = product?.image || '/static/placeholder-image.jpg';
    return <img alt="" src={url} style={style || { width: 65 }} />;
  }
}
