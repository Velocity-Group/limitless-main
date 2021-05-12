/* eslint-disable no-nested-ternary */
import { PureComponent } from 'react';
import { Button, Form, Input } from 'antd';
import { } from '@ant-design/icons';
import { IPerformer } from 'src/interfaces/index';
import '../post/index.less';

interface IProps {
  streamType: string;
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

export class PurchaseStreamForm extends PureComponent<IProps> {
  render() {
    const {
      onFinish, performer, streamType, submiting
    } = this.props;
    return (
      <div className="text-center">
        <div className="tip-performer">
          <img alt="p-avt" src={(performer?.avatar) || '/static/no-avatar.png'} style={{ width: '100px', borderRadius: '50%' }} />
          <div>
            {performer?.name || 'N/A'}
            <br />
            <small>
              @
              {performer?.username || 'n/a'}
            </small>
          </div>
        </div>
        <Form
          {...layout}
          name="nest-messages"
          onFinish={onFinish.bind(this)}
          initialValues={{
            userNote: ''
          }}
        >
          {streamType === 'private' && (
          <Form.Item name="userNote">
            <Input.TextArea rows={3} maxLength={100} placeholder="Note something..." />
          </Form.Item>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Button className="primary" htmlType="submit" loading={submiting} disabled={submiting} block>
              Confirm to join this session by
              &nbsp;
              <img src="/static/gem-ico.png" alt="gem" width="20px" />
              {streamType === 'public' ? (performer?.publicChatPrice || 0).toFixed(2) : streamType === 'group' ? (performer?.groupChatPrice || 0).toFixed(2) : (performer?.privateChatPrice || 0).toFixed(2)}
              {' '}
              per minute
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}
