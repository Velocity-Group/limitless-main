import { PureComponent } from 'react';
import {
  Button
} from 'antd';
import { IProduct } from '@interfaces/index';

interface IProps {
  submiting: boolean;
  product: IProduct;
  onFinish: Function;
}

export class PurchaseProductForm extends PureComponent<IProps> {
  render() {
    const { product, onFinish, submiting } = this.props;
    const image = product?.image || '/placeholder-image.jpg';

    return (
      <div className="text-center">
        <div className="tip-performer">
          <img alt="p-avt" src={image} style={{ width: '220px', borderRadius: '5px' }} />
          <h4>
            {product?.name}
          </h4>
          <p>{product?.description}</p>
        </div>
        <div className="text-center">
          <Button
            onClick={() => onFinish()}
            className="primary"
            type="primary"
            loading={submiting}
            disabled={submiting}
          >
            Confirm to purchase at &nbsp;
            <img alt="token" src="/static/coin-ico.png" height="15px" style={{ margin: '0 3px' }} />
            {(product?.price || 0).toFixed(2)}
          </Button>
        </div>

      </div>
    );
  }
}
