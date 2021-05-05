import { PureComponent } from 'react';
import { IProductUpdate } from 'src/interfaces';

interface IProps {
  product?: IProductUpdate;
  style?: Record<string, string>;
}

export class ImageProduct extends PureComponent<IProps> {
  render() {
    const { product, style } = this.props;
    const url = product?.image || '/static/placeholder-image.jpg';
    return <img alt="" src={url} style={style || { width: 65 }} />;
  }
}
