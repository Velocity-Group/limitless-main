import { PureComponent } from 'react';
import {
  Form, Button, Row, Col, message, Progress, Image
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
  updating?: boolean;
}

export class PerformerVerificationForm extends PureComponent<IProps> {
  idVerificationFileId: string;

  documentVerificationFileId: string;

  state = {
    idImage: '',
    documentImage: '',
    isUploading: false,
    idImgProgress: 0,
    documentImgProgress: 0
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
      isUploading, idImage, documentImage, idImgProgress, documentImgProgress
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
              label="ID photo"
              valuePropName="fileList"
              className="model-photo-verification"
              help="Please upload proof of one of either of the following: social security number or national insurance number or passport or a different photographic id to your photo verification"
            >
              <div className="document-upload">
                <ImageUpload accept="image/*" headers={headers} uploadUrl={documentUploadUrl} onUploaded={this.onFileUploaded.bind(this, 'idFile')} />
                {idImage ? (
                  <Image alt="id-img" src={idImage} style={{ margin: 5, height: '140px' }} />
                ) : <img src="/static/front-id.jpeg" height="140px" alt="id-img" />}
              </div>
              {idImgProgress > 0 && <Progress percent={idImgProgress} />}
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              labelCol={{ span: 24 }}
              label="Holding ID photo"
              valuePropName="fileList"
              className="model-photo-verification"
              help="Upload a photo of yourself holding your indentity document next to your face"
            >
              <div className="document-upload">
                <ImageUpload accept="image/*" headers={headers} uploadUrl={documentUploadUrl} onUploaded={this.onFileUploaded.bind(this, 'documentFile')} />
                {documentImage ? (
                  <Image alt="id-img" src={documentImage} style={{ margin: 5, height: '140px' }} />
                ) : <img src="/static/holding-id.jpeg" height="140px" alt="holding-id" />}
              </div>
              {documentImgProgress > 0 && <Progress percent={documentImgProgress} />}
            </Form.Item>
          </Col>
        </Row>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 8 }}>
          <Button className="primary" type="primary" htmlType="submit" disabled={updating || isUploading} loading={updating || isUploading}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
