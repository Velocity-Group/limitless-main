import { useState } from 'react';
import {
  Form, Button, Row, Col, message, Input
} from 'antd';
import { IPerformer } from 'src/interfaces';
import { ImageUpload } from '@components/file';
import { performerService, authService } from '@services/index';
import { IntlShape, useIntl } from 'react-intl';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  user: IPerformer;
  onFinish: Function;
}

export function PerformerWelcomeMessageForm({ user, onFinish }: IProps) {
  const [messagePhotoUrl, setUrl] = useState<string>(user?.messagePhoto?.url || '');
  const intl: IntlShape = useIntl();
  const onFileUploaded = (file) => {
    setUrl(file?.response?.data.url);
    message.success(intl.formatMessage({ id: 'photoHasBeenUploaded', defaultMessage: 'Photo has been uploaded!' }));
  };

  const uploadUrl = performerService.getMessageUploadUrl();
  const headers = {
    authorization: authService.getToken()
  };

  return (
    <Form
      {...layout}
      name="nest-messages"
      labelAlign="left"
      className="account-form"
      onFinish={onFinish.bind(this)}
      initialValues={user}
    >
      <Row>
        <Col xs={24} sm={24}>
          <Form.Item
            labelCol={{ span: 24 }}
            label={intl.formatMessage({ id: 'welcomeMessagePhoto', defaultMessage: 'Welcome message photo' })}
          >
            <ImageUpload
              accept="image/*"
              options={{
                fieldName: 'welcome-message'
              }}
              imageUrl={messagePhotoUrl}
              headers={headers}
              uploadUrl={`${uploadUrl}`}
              onUploaded={onFileUploaded}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24}>
          <Form.Item
            labelCol={{ span: 24 }}
            name="defaultMessageText"
            label={intl.formatMessage({ id: 'welcomeMessageText', defaultMessage: 'Welcome message text' })}
            extra={intl.formatMessage({ id: 'whenAUserFollowsSubscribesToYouAWelcomeMessageAutomaticallySentToUserInbox', defaultMessage: 'When a user follows/subscribes to you, a welcome message automatically sent to user inbox' })}
            rules={[
              { required: true, message: intl.formatMessage({ id: 'pleaseInputWelcomeMessage', defaultMessage: 'Please input welcome message!' }) }
            ]}
          >
            <Input.TextArea rows={2} maxLength={100} showCount />
          </Form.Item>
        </Col>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button className="primary" type="primary" htmlType="submit">
            {intl.formatMessage({ id: 'saveChanges', defaultMessage: 'Save Changes' })}
          </Button>
        </Form.Item>
      </Row>
    </Form>
  );
}
