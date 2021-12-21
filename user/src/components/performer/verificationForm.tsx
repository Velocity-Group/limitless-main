import { PureComponent } from 'react';
import {
  Form, Button, Row, Col, message, Image
} from 'antd';
import { IPerformer } from 'src/interfaces';
import { ImageUpload } from '@components/file';
import { performerService, authService } from '@services/index';
import './performer.less';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  onFinish: Function;
  user: IPerformer;
  updating: boolean;
}

export class PerformerVerificationForm extends PureComponent<IProps> {
  idVerificationFileId: string;

  documentVerificationFileId: string;

  state = {
    idImage: '',
    documentImage: ''
  }

  componentDidMount() {
    const { user } = this.props;
    if (user.documentVerification) {
      this.documentVerificationFileId = user?.documentVerification?._id;
      this.setState({ documentImage: user?.documentVerification?.url });
    }
    if (user.idVerification) {
      this.idVerificationFileId = user?.idVerification?._id;
      this.setState({ idImage: user?.idVerification?.url });
    }
  }

  onFileUploaded(type, file) {
    if (file && type === 'idFile') {
      this.idVerificationFileId = file?.response?.data?._id;
      this.setState({ idImage: file?.response?.data.url });
    }
    if (file && type === 'documentFile') {
      this.documentVerificationFileId = file?.response?.data?._id;
      this.setState({ documentImage: file?.response?.data.url });
    }
  }

  render() {
    const {
      onFinish, updating
    } = this.props;
    const {
      idImage, documentImage
    } = this.state;
    const documentUploadUrl = performerService.getDocumentUploadUrl();
    const headers = {
      authorization: authService.getToken()
    };
    return (
      <Form
        {...layout}
        name="nest-messages"
        onFinish={(values) => {
          if (!this.idVerificationFileId || !this.documentVerificationFileId) {
            return message.error('ID documents are required', 5);
          }
          const data = { ...values };
          data.idVerificationId = this.idVerificationFileId;
          data.documentVerificationId = this.documentVerificationFileId;
          return onFinish(data);
        }}
        labelAlign="left"
        className="account-form"
      >
        <Row>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              labelCol={{ span: 24 }}
              label="Your government issued ID"
              className="model-photo-verification"
            >
              <div className="document-upload">
                <ImageUpload accept="image/*" headers={headers} uploadUrl={documentUploadUrl} onUploaded={this.onFileUploaded.bind(this, 'idFile')} />
                {idImage ? (
                  <Image alt="id-img" src={idImage} style={{ margin: 5, height: '150px' }} />
                ) : <img src="/static/front-id.png" height="150px" alt="id-img" />}
              </div>
              <div className="ant-form-item-explain" style={{ textAlign: 'left' }}>
                <ul className="list-issued-id">
                  <li>Government-issued ID card</li>
                  <li>National Id card</li>
                  <li>Passport</li>
                  <li>Driving license</li>
                </ul>
              </div>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              labelCol={{ span: 24 }}
              label="Your selfie with your ID and handwritten note"
              className="model-photo-verification"
            >
              <div className="document-upload">
                <ImageUpload accept="image/*" headers={headers} uploadUrl={documentUploadUrl} onUploaded={this.onFileUploaded.bind(this, 'documentFile')} />
                {documentImage ? (
                  <Image alt="id-img" src={documentImage} style={{ margin: 5, height: '150px' }} />
                ) : <img src="/static/holding-id.jpg" height="150px" alt="holding-id" />}
              </div>
              <div className="ant-form-item-explain" style={{ textAlign: 'left' }}>
                <ul className="list-issued-id">
                  <li>
                    On a blank piece of white paper write your name, today&apos;s date and our website address
                    {' '}
                    {window.location.hash}
                  </li>
                  <li>Hold your paper and your ID so we can clearly see hoth</li>
                  <li>Take a selfie of you, your ID and your handwritten note. All three elements (you, your ID and your writting) must be clearly visible without copying or editing</li>
                </ul>
              </div>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item className="text-center">
          <Button className="primary" type="primary" htmlType="submit" disabled={updating} loading={updating}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
