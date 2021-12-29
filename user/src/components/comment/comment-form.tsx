import { PureComponent, createRef } from 'react';
import {
  Form, Input, Button, message, Popover
} from 'antd';
import {
  SendOutlined, SmileOutlined
} from '@ant-design/icons';
import { IUser } from 'src/interfaces';
import { Emotions } from '@components/messages/emotions';
import { FormInstance } from 'antd/lib/form';
import { ICreateComment } from 'src/interfaces/comment';
import Router from 'next/router';
import './comment.less';

interface IProps {
  objectId: string;
  objectType?: string;
  onSubmit: Function;
  creator: IUser;
  requesting: boolean;
  isReply?: boolean;
  siteName?: string;
}

const { TextArea } = Input;

export class CommentForm extends PureComponent<IProps> {
  formRef: any;

  state = {
    text: ''
  }

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
  }

  onFinish(values: ICreateComment) {
    const {
      onSubmit: handleComment, objectId, objectType, creator
    } = this.props;
    const data = values;
    if (!creator || !creator._id) {
      message.error('Please login!');
      return Router.push('/');
    }
    if (!data.content) {
      return message.error('Please add a comment!');
    }
    if (data.content.length > 150) {
      return message.error('Comment is over 150 characters');
    }
    data.objectId = objectId;
    data.objectType = objectType || 'video';
    this.formRef.resetFields();
    return handleComment(data);
  }

  async onEmojiClick(emoji) {
    const { creator } = this.props;
    if (!creator || !creator._id) return;
    const { text } = this.state;
    const instance = this.formRef as FormInstance;
    instance.setFieldsValue({
      content: `${instance.getFieldValue('content')} ${emoji} `
    });
    this.setState({ text: `${text} ${emoji} ` });
  }

  render() {
    const {
      creator, requesting, isReply, siteName, objectId
    } = this.props;
    if (!this.formRef) this.formRef = createRef();
    return (
      <Form
        ref={(ref) => { this.formRef = ref; }}
        name="comment-form"
        onFinish={this.onFinish.bind(this)}
        initialValues={{
          content: ''
        }}
      >
        <div className="comment-form">
          <div className="cmt-area">
            <Form.Item
              name="content"
            >
              <TextArea disabled={!creator || !creator._id} maxLength={150} showCount minLength={1} rows={!isReply ? 2 : 1} placeholder={!isReply ? 'Add a comment here' : 'Add a reply here'} />
            </Form.Item>
            <Popover key={objectId} className="emotion-popover" content={<Emotions onEmojiClick={this.onEmojiClick.bind(this)} siteName={siteName} />} title={null} trigger="click">
              <div className="grp-emotions">
                <SmileOutlined />
              </div>
            </Popover>
          </div>
          <Button className={!isReply ? 'submit-btn' : ''} htmlType="submit" disabled={requesting}>
            {!isReply ? <SendOutlined /> : 'Reply'}
          </Button>
        </div>
      </Form>
    );
  }
}
