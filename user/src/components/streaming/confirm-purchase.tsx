/* eslint-disable no-nested-ternary */
import { PureComponent } from 'react';
import { Button, Form } from 'antd';
import { IPerformer, IStream } from 'src/interfaces';
import '../post/index.less';

interface IProps {
  activeStream: IStream;
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
      onFinish, performer, activeStream, submiting
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
          initialValues={{ }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Button className="primary" htmlType="submit" loading={submiting} disabled={submiting} block>
              Confirm to join this session for
              &nbsp;
              <img src="/static/coin-ico.png" alt="gem" width="20px" />
              {activeStream.price.toFixed(2)}
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}
