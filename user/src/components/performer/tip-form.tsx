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
      <div className="confirm-subscription-form">
        <div className="text-center">
          <Avatar src={performer?.avatar || '/static/no-avatar.png'} />
          <p>
            {performer?.name || performer?.username || 'N/A'}
            {' '}
            {performer?.verifiedAccount && <TickIcon className="primary-color" />}
          </p>
        </div>
        <div className="tip-grps">
          <Button type={price === 10 ? 'primary' : 'default'} onClick={() => this.onChangeValue(10)}>
            <img src="/static/coin-ico.png" width="20px" alt="gem-ico" />
            {' '}
            10
          </Button>
          <Button type={price === 20 ? 'primary' : 'default'} onClick={() => this.onChangeValue(20)}>
            <img src="/static/coin-ico.png" width="20px" alt="gem-ico" />
            {' '}
            20
          </Button>
          <Button type={price === 50 ? 'primary' : 'default'} onClick={() => this.onChangeValue(50)}>
            <img src="/static/coin-ico.png" width="20px" alt="gem-ico" />
            {' '}
            50
          </Button>
          <Button type={price === 100 ? 'primary' : 'default'} onClick={() => this.onChangeValue(100)}>
            <img src="/static/coin-ico.png" width="20px" alt="gem-ico" />
            {' '}
            100
          </Button>
          <Button type={price === 200 ? 'primary' : 'default'} onClick={() => this.onChangeValue(200)}>
            <img src="/static/coin-ico.png" width="20px" alt="gem-ico" />
            {' '}
            200
          </Button>
          <Button type={price === 500 ? 'primary' : 'default'} onClick={() => this.onChangeValue(500)}>
            <img src="/static/coin-ico.png" width="20px" alt="gem-ico" />
            {' '}
            500
          </Button>
          <Button type={price === 1000 ? 'primary' : 'default'} onClick={() => this.onChangeValue(1000)}>
            <img src="/static/coin-ico.png" width="20px" alt="gem-ico" />
            {' '}
            1000
          </Button>
        </div>
        <div className="info-body">
          <div style={{ margin: '0 0 20px', textAlign: 'center' }}>
            <p>Enter your tip amount in tokens</p>
            <InputNumber min={1} onChange={this.onChangeValue.bind(this)} value={price} />
          </div>
        </div>
        <Button type="primary" disabled={submiting} loading={submiting} onClick={() => onFinish(price)}>SEND TIP</Button>
      </div>
    );
  }
}
