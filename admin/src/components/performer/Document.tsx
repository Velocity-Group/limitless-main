import { PureComponent } from 'react';
import {
  Form, Button, Row, Col, Image, Switch, message, Spin
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
    documentVerificationUrl: '',
    fetching: false,
    indentity: null
  };

  componentDidMount() {
    const { performer } = this.props;
    this.setState({
      idVerificationUrl: performer?.idVerification?.url || '',
      documentVerificationUrl: performer?.documentVerification?.url || ''
    });
    this.getVeriffResources();
  }

  getVeriffResources = async () => {
    const { performer } = this.props;
    try {
      this.setState({ fetching: true });
      const resp = await performerService.getDecision(performer._id);
      this.setState({ indentity: resp.data, fetching: false });
    } catch (e) {
      this.setState({ fetching: false });
    }
  }

  render() {
    const {
      onFinish, submiting, performer
    } = this.props;
    const {
      idVerificationUrl, documentVerificationUrl, fetching, indentity
    } = this.state;
    const uploadHeaders = {
      authorization: authService.getToken()
    };
    return (
      <Form
        {...layout}
        name="form-performer"
        initialValues={performer}
        onFinish={onFinish.bind(this)}
      >
        {fetching && <div style={{ margin: 30, textAlign: 'center' }}><Spin /></div>}
        {!fetching && indentity && (
          <h3>
            Veriff Indentity Id:
            {' '}
            {indentity.sessionId}
          </h3>
        )}
        {!fetching && !indentity && (
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
          </Row>
        )}
        <Form.Item
          name="verifiedDocument"
          label="Verified ID Documents?"
          valuePropName="checked"
          help="Allow model to start posting contents"
        >
          <Switch />
        </Form.Item>
        <Form.Item className="text-center">
          <Button block type="primary" htmlType="submit" disabled={submiting} loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
