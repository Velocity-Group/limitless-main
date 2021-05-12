import { PureComponent } from 'react';
import {
  Switch, Button, Form, Input
} from 'antd';
import { IPerformer } from '@interface/performer';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
  streamType: string;
  isFree?: boolean;
  conversationDescription?: string;
}

export default class StreamPriceForm extends PureComponent<IProps> {
  state = {
    isFree: false
  }

  componentDidMount() {
    const { isFree } = this.props;
    isFree !== undefined && this.setState({ isFree });
  }

  render() {
    const {
      onFinish, submiting = false, conversationDescription, performer, streamType
    } = this.props;
    const { isFree } = this.state;
    const price = () => {
      switch (streamType) {
        case 'public': return (performer?.publicChatPrice || 0).toFixed(2);
        case 'group': return (performer?.groupChatPrice || 0).toFixed(2);
        case 'private': return (performer?.privateChatPrice || 0).toFixed(2);
        default: break;
      }
    };
    return (
      <div>
        <Form
          {...layout}
          name="nest-messages"
          onFinish={onFinish.bind(this)}
          initialValues={{
            name: conversationDescription || '',
            isFree
          }}
          className="account-form"
        >
          <Form.Item
            name="name"
            label="Conversation description"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="isFree"
            label="Free Session?"
          >
            <Switch unCheckedChildren="Non-free" checkedChildren="Free" checked={isFree} onChange={(val) => this.setState({ isFree: val })} />
          </Form.Item>
          {!isFree && (
          <p>
            <img alt="token" src="/static/gem-ico.png" width="20px" />
            {price()}
            {' '}
            per minute
          </p>
          )}
          <Form.Item>
            <Button className="primary" type="primary" htmlType="submit" loading={submiting} disabled={submiting}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}
