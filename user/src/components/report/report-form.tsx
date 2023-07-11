import { PureComponent } from 'react';
import {
  Input, Button, Avatar, Form, Select
} from 'antd';
import { IPerformer } from '@interfaces/index';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
  intl: IntlShape
}

class ReportForm extends PureComponent<IProps> {
  render() {
    const {
      onFinish, submiting = false, performer, intl
    } = this.props;
    return (
      <div className="confirm-purchase-form">
        <div className="text-center">
          <Avatar
            alt="main-avt"
            src={performer?.avatar || '/static/no-avatar.png'}
          />
        </div>
        <div className="info-body">
          <div style={{ marginBottom: '15px', width: '100%' }}>
            <p>{intl.formatMessage({ id: 'reportPost', defaultMessage: 'Report post' })}</p>
            <Form
              name="report-form"
              onFinish={onFinish.bind(this)}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              className="account-form"
              scrollToFirstError
              initialValues={{
                title: intl.formatMessage({ id: 'violentOrRepulsiveContent', defaultMessage: 'Violent or repulsive content' }),
                description: ''
              }}
            >
              <Form.Item
                label={intl.formatMessage({ id: 'title', defaultMessage: 'Title' })}
                name="title"
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'pleaseSelectTitle', defaultMessage: 'Please select title' }) }
                ]}
                validateTrigger={['onChange', 'onBlur']}
              >
                <Select>
                  <Select.Option value="Violent or repulsive content" key="Violent or repulsive content">{intl.formatMessage({ id: 'violentOrRepulsiveContent', defaultMessage: 'Violent or repulsive content' })}</Select.Option>
                  <Select.Option value="Hateful or abusive content" key="Hateful or abusive content">{intl.formatMessage({ id: 'hatefulOrAbusiveContent', defaultMessage: ' Hateful or abusive content' })}</Select.Option>
                  <Select.Option value="Harassment or bullying" key="Harassment or bullying">{intl.formatMessage({ id: 'harassmentOrBullying', defaultMessage: 'Harassment or bullying' })}</Select.Option>
                  <Select.Option value="Harmful or dangerous acts" key="Harmful or dangerous acts">{intl.formatMessage({ id: 'harmfulOrDangerousActs', defaultMessage: 'Harmful or dangerous acts' })}</Select.Option>
                  <Select.Option value="Child abuse" key="Child abuse">{intl.formatMessage({ id: 'childAbuse', defaultMessage: 'Child abuse' })}</Select.Option>
                  <Select.Option value="Promotes terrorism" key="Promotes terrorism">{intl.formatMessage({ id: 'promotesTerrorism', defaultMessage: 'Promotes terrorism' })}</Select.Option>
                  <Select.Option value="Spam or misleading" key="Spam or misleading">{intl.formatMessage({ id: 'spamOrMisleading', defaultMessage: 'Spam or misleading' })}</Select.Option>
                  <Select.Option value="Infringes my rights" key="Infringes my rights">{intl.formatMessage({ id: 'infringesMyRights', defaultMessage: 'Infringes my rights' })}</Select.Option>
                  <Select.Option value="Others" key="Others">{intl.formatMessage({ id: 'others', defaultMessage: 'Others' })}</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="description"
                label={intl.formatMessage({ id: 'description', defaultMessage: 'Description' })}
              >
                <Input.TextArea placeholder={intl.formatMessage({ id: 'tellUsWhyYouReport', defaultMessage: '"Tell us why you report?"' })} minLength={20} showCount maxLength={100} rows={3} />
              </Form.Item>
              <Form.Item>
                <Button
                  className="primary"
                  htmlType="submit"
                  loading={submiting}
                  disabled={submiting}
                >
                  {intl.formatMessage({ id: 'submit', defaultMessage: 'SUBMIT' })}
                </Button>
              </Form.Item>
            </Form>

          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(ReportForm);
