import { PureComponent } from 'react';
import { Button } from 'antd';
import { } from '@ant-design/icons';
import { IVideo } from '@interfaces/index';

interface IProps {
  video: IVideo;
  onFinish: Function;
  submiting: boolean;
}

export class PurchaseVideoForm extends PureComponent<IProps> {
  render() {
    const { onFinish, submiting = false, video } = this.props;
    return (
      <div className="text-center">
        <div className="tip-performer">
          <img alt="p-avt" src={video?.performer?.avatar || '/no-avatar.png'} style={{ width: '100px', borderRadius: '50%' }} />
          <div>
            {video?.performer?.name}
            <small>
              @
              {video?.performer?.username}
            </small>
          </div>
        </div>
        <div style={{ margin: '20px 0' }} />
        <Button type="primary" loading={submiting} disabled={submiting} onClick={onFinish.bind(this)}>
          Unlock video by
          {' '}
          {video.price.toFixed(2)}
          {' '}
          <img alt="token" src="/static/coin-ico.png" height="25px" />
        </Button>
      </div>
    );
  }
}
