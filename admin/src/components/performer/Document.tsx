import { PureComponent } from 'react';
import {
  Form, Button, Row, Col, Image, Switch, message
} from 'antd';
import { IPerformer } from 'src/interfaces';
import { performerService, authService } from '@services/index';
import { ImageUpload } from '@components/file/image-upload';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
}

export class PerformerDocument extends PureComponent<IProps> {
  state = {
    idVerificationUrl: '',
    documentVerificationUrl: ''
  };

  componentDidMount() {
    const { performer } = this.props;
    this.setState({
      idVerificationUrl: performer?.idVerification?.url || '',
      documentVerificationUrl: performer?.documentVerification?.url || ''
    });
  }

  render() {
    const {
      onFinish, submiting, performer
    } = this.props;
    const { idVerificationUrl, documentVerificationUrl } = this.state;
    const uploadHeaders = {
      authorization: authService.getToken()
    };
    return (
      <Form {...layout} name="form-performer" onFinish={onFinish.bind(this)}>
        <Row>
          <Col md={12} xs={24}>
            <Form.Item
              style={{ textAlign: 'center' }}
              label="Govt issued ID photo"
            >
              <ImageUpload
                uploadUrl={`${performerService.getUploadDocumentUrl()}/${performer._id}/idVerificationId`}
                headers={uploadHeaders}
                onUploaded={(resp) => {
                  this.setState({ idVerificationUrl: resp.response.data.url });
                  message.success('Id photo has been uploaded!');
                }}
              />
              {idVerificationUrl ? (
                <Image alt="id-img" src={idVerificationUrl} style={{ height: '150px' }} />
              ) : <img src="/front-id.png" height="150px" alt="id-img" />}
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item
              style={{ textAlign: 'center' }}
              label="Selfie with ID photo and handwritten note"
            >
              <ImageUpload
                uploadUrl={`${performerService.getUploadDocumentUrl()}/${performer._id}/documentVerificationId`}
                headers={uploadHeaders}
                onUploaded={(resp) => {
                  this.setState({
                    documentVerificationUrl: resp.response.data.url
                  });
                  message.success('Selfie photo has been uploaded!');
                }}
              />
              {documentVerificationUrl ? (
                <Image alt="id-img" src={documentVerificationUrl} style={{ height: '150px' }} />
              ) : <img src="/holding-id.jpg" height="150px" alt="holding-id" />}
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="verifiedDocument"
              label="Verified ID Documents?"
              valuePropName="checked"
              help="Allow model to start posting contents"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item className="text-center">
          <Button type="primary" htmlType="submit" disabled={submiting} loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
