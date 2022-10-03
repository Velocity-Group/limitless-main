import { PureComponent } from 'react';
import {
  InputNumber, Button, Avatar
} from 'antd';
import { TickIcon } from 'src/icons';
import { IPerformer } from '@interfaces/index';
import './performer.less';

interface IProps {
  performer: IPerformer;
  onFinish(price: any): Function;
  submiting: boolean;
}

export class TipPerformerForm extends PureComponent<IProps> {
  state = {
    price: 10
  }

  onChangeValue(price) {
    this.setState({ price });
  }

  render() {
    const {
      onFinish, submiting = false, performer
    } = this.props;
    const { price } = this.state;
    return (
      <div className="confirm-purchase-form">
        <div className="left-col">
          <Avatar src={performer?.avatar || '/static/no-avatar.png'} />
          <div className="p-name">
            {performer?.name || 'N/A'}
            {' '}
            {performer?.verifiedAccount && <TickIcon className="primary-color" />}
          </div>
          <div className="p-username">
            @
            {performer?.username || 'n/a'}
          </div>
          <img className="lock-icon" src="/static/lock-icon.png" alt="lock" />
        </div>
        <div className="right-col">
          <h2>
            TIP
            {' '}
            <span className="username">{`@${performer?.username}` || 'the model'}</span>
          </h2>
          <h3>
            <span className="price">{price.toFixed(2)}</span>
            {' '}
            USD
          </h3>
          <div className="tip-grps">
            <Button type={price === 10 ? 'primary' : 'default'} onClick={() => this.onChangeValue(10)}>
              $10
            </Button>
            <Button type={price === 20 ? 'primary' : 'default'} onClick={() => this.onChangeValue(20)}>
              $20
            </Button>
            <Button type={price === 50 ? 'primary' : 'default'} onClick={() => this.onChangeValue(50)}>
              $50
            </Button>
            <Button type={price === 100 ? 'primary' : 'default'} onClick={() => this.onChangeValue(100)}>
              $100
            </Button>
            <Button type={price === 200 ? 'primary' : 'default'} onClick={() => this.onChangeValue(200)}>
              $200
            </Button>
            <Button type={price === 300 ? 'primary' : 'default'} onClick={() => this.onChangeValue(300)}>
              $300
            </Button>
            <Button type={price === 400 ? 'primary' : 'default'} onClick={() => this.onChangeValue(400)}>
              $400
            </Button>
            <Button type={price === 500 ? 'primary' : 'default'} onClick={() => this.onChangeValue(500)}>
              $500
            </Button>
            <Button type={price === 1000 ? 'primary' : 'default'} onClick={() => this.onChangeValue(1000)}>
              $1000
            </Button>
          </div>
          <div className="tip-input">
            <p>Enter tip amount</p>
            <InputNumber min={1} onChange={this.onChangeValue.bind(this)} value={price} />
          </div>
          <Button
            className="primary"
            disabled={submiting}
            loading={submiting}
            onClick={() => onFinish(price)}
          >
            SEND TIP
          </Button>
        </div>

      </div>
    );
  }
}
