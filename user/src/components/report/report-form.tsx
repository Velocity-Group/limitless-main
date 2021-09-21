import { PureComponent } from 'react';
import {
  Input, Button, Avatar
} from 'antd';
import { IPerformer } from '@interfaces/index';

interface IProps {
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
}

export class ReportForm extends PureComponent<IProps> {
  state = {
    reason: 'Anoying'
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
        <div className="text-center">
          <Avatar
            alt="main-avt"
            src={performer?.avatar || '/static/no-avatar.png'}
          />
        </div>
        <div className="info-body">
          <div style={{ marginBottom: '15px', width: '100%', textAlign: 'center' }}>
            <p>Report post</p>
            <Input.TextArea placeholder="Tell us why you report?" minLength={20} showCount maxLength={100} onChange={this.onChangeValue.bind(this)} rows={3} />
          </div>
        </div>
        <Button type="primary" disabled={submiting} loading={submiting} onClick={() => onFinish(reason)}>SUBMIT</Button>
      </div>
    );
  }
}
