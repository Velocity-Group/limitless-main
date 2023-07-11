/* eslint-disable no-nested-ternary */
import { PureComponent } from 'react';
import { Button, Form } from 'antd';
import { IPerformer, IStream } from 'src/interfaces';
import '../post/index.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  activeStream: IStream;
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
  intl: IntlShape
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

class PurchaseStreamForm extends PureComponent<IProps> {
  render() {
    const {
      onFinish, performer, activeStream, submiting, intl
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
          initialValues={{}}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Button className="primary" htmlType="submit" loading={submiting} disabled={submiting} block>
              {intl.formatMessage({ id: 'confirmToJoinThisSessionFor', defaultMessage: 'Confirm to join this session for' })}
              $
              {' '}
              {(activeStream.price || 0).toFixed(2)}
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}

export default injectIntl(PurchaseStreamForm);
