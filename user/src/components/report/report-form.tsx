import { PureComponent } from 'react';
import {
  Input, Button
} from 'antd';
import { IPerformer } from '@interfaces/index';
import {
  CheckCircleOutlined
} from '@ant-design/icons';

interface IProps {
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
}

export class ReportForm extends PureComponent<IProps> {
  state = {
    reason: ''
  }

  onChangeValue(e) {
    this.setState({ reason: e.target.value });
  }

  render() {
    const {
      onFinish, submiting = false, performer
    } = this.props;
    const { reason } = this.state;
    return (
      <div className="confirm-subscription-form">
        <div className="profile-info">
          <img
            width="100%"
            alt="main-avt"
            src={performer?.avatar || '/static/no-avatar.png'}
          />
          <div className="m-user-name">
            <h4>
              {performer?.name || 'N/A'}
                  &nbsp;
              {performer?.verifiedAccount && (
                <CheckCircleOutlined className="theme-color" />
              )}
            </h4>
            <h5 style={{ textTransform: 'none' }}>
              @
              {performer?.username || 'n/a'}
            </h5>
          </div>
        </div>
        <div className="info-body">
          <div style={{ marginBottom: '15px', width: '100%', textAlign: 'center' }}>
            <p>Report post</p>
            <Input.TextArea placeholder="Tell us why you report?" minLength={20} showCount maxLength={150} onChange={this.onChangeValue.bind(this)} rows={3} />
          </div>
        </div>
        <Button type="primary" disabled={submiting} loading={submiting} onClick={() => onFinish(reason)}>SUBMIT</Button>
      </div>
    );
  }
}
