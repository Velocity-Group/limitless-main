/* eslint-disable no-template-curly-in-string */
import { PureComponent } from 'react';
import {
  Form, Input, Button, Select, message, Divider
} from 'antd';
import { settingService } from 'src/services/setting.service';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!',
  types: {
    email: 'Not a validate email!',
    number: 'Not a validate number!'
  },
  number: {
    range: 'Must be between ${min} and ${max}'
  }
};

interface IProps {
  settings: any;
}

export class S3SettingsForm extends PureComponent<IProps> {
  state = {
    s3ServiceProvider: 'gcs',
    submiting: false
  }

  componentDidMount(): void {
    const {
      settings
    } = this.props;
    const s3ServiceProvider = settings.find((s) => s.key === 's3ServiceProvider');
    this.setState({
      s3ServiceProvider: s3ServiceProvider?.value || 'gcs'
    });
  }

  onSubmit = async (data) => {
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const key of Object.keys(data)) {
        // eslint-disable-next-line no-await-in-loop
        await settingService.update(key, data[key]);
      }
      message.success('Updated setting successfully');
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(err?.message || 'Error occured, please try again later');
    }
  }

  render() {
    const {
      settings
    } = this.props;
    const { s3ServiceProvider, submiting } = this.state;
    const s3provider = settings.find((s) => s.key === 's3ServiceProvider');
    const s3BucketName = settings.find((s) => s.key === 's3BucketName');
    const s3RegionName = settings.find((s) => s.key === 's3RegionName');
    const s3AccessKeyId = settings.find((s) => s.key === 's3AccessKeyId');
    const s3SecretAccessKey = settings.find((s) => s.key === 's3SecretAccessKey');
    const s3BucketEnpoint = settings.find((s) => s.key === 's3BucketEnpoint');
    const gcsProjectId = settings.find((s) => s.key === 'gcsProjectId');
    const gcsBucketName = settings.find((s) => s.key === 'gcsBucketName');
    const gcsPrivateKeyId = settings.find((s) => s.key === 'gcsPrivateKeyId');
    const gcsPrivateKeySecret = settings.find((s) => s.key === 'gcsPrivateKeySecret');
    const gcsClientEmail = settings.find((s) => s.key === 'gcsClientEmail');
    const gcsClientId = settings.find((s) => s.key === 'gcsClientId');
    const gcsClientCertUrl = settings.find((s) => s.key === 'gcsClientCertUrl');

    return (
      <Form
        {...layout}
        name="form-banking-performer"
        onFinish={this.onSubmit.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields')}
        validateMessages={validateMessages}
        initialValues={{
          s3ServiceProvider: s3provider?.value,
          s3BucketName: s3BucketName?.value,
          s3RegionName: s3RegionName?.value,
          s3AccessKeyId: s3AccessKeyId?.value,
          s3SecretAccessKey: s3SecretAccessKey?.value,
          s3BucketEnpoint: s3BucketEnpoint?.value,
          gcsProjectId: gcsProjectId?.value,
          gcsBucketName: gcsBucketName?.value,
          gcsPrivateKeyId: gcsPrivateKeyId?.value,
          gcsPrivateKeySecret: gcsPrivateKeySecret?.value,
          gcsClientEmail: gcsClientEmail?.value,
          gcsClientId: gcsClientId?.value,
          gcsClientCertUrl: gcsClientCertUrl?.value
        }}
      >
        <Form.Item
          name="s3ServiceProvider"
          label="S3 Provider"
          rules={[{ required: true }]}
        >
          <Select onChange={(val) => this.setState({ s3ServiceProvider: val })}>
            <Select.Option value="gcs" key="gcs">GCS</Select.Option>
            <Select.Option value="aws" key="aws">AWS</Select.Option>
          </Select>
        </Form.Item>
        <Divider>*</Divider>
        {s3ServiceProvider === 'gcs' && (
          <>
            <Form.Item
              label="GCS project Id"
              name="gcsProjectId"
              rules={[{ required: true }]}
              extra={gcsProjectId?.description || ''}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="GCS bucket name"
              name="gcsBucketName"
              rules={[{ required: true }]}
              extra={gcsBucketName?.description || ''}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="GCS private key id"
              name="gcsPrivateKeyId"
              rules={[{ required: true }]}
              extra={gcsPrivateKeyId?.description || ''}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="GCS client Email"
              name="gcsClientEmail"
              rules={[{ required: true }]}
              extra={gcsClientEmail?.description || ''}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="GCS client id"
              name="gcsClientId"
              rules={[{ required: true }]}
              extra={gcsClientId?.description || ''}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="GCS client cert url"
              name="gcsClientCertUrl"
              rules={[{ required: true }]}
              extra={gcsClientCertUrl?.description || ''}
            >
              <Input />
            </Form.Item>
          </>
        )}

        {s3ServiceProvider === 'aws' && (
          <>
            <Form.Item
              label="Bucket name"
              name="s3BucketName"
              rules={[{ required: true }]}
              extra={s3BucketName?.description || ''}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Region name"
              name="s3RegionName"
              rules={[{ required: true }]}
              extra={s3RegionName?.description || ''}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Access key Id"
              name="s3AccessKeyId"
              rules={[{ required: true }]}
              extra={s3AccessKeyId?.description || ''}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Access key secret"
              name="s3SecretAccessKey"
              rules={[{ required: true }]}
              extra={s3SecretAccessKey?.description || ''}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Bucket enpoint"
              name="s3BucketEnpoint"
              rules={[{ required: true }]}
              extra={s3BucketEnpoint?.description || ''}
            >
              <Input />
            </Form.Item>
          </>
        )}

        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" disabled={submiting} loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
