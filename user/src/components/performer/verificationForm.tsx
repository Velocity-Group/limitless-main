import { PureComponent } from 'react';
import {
  Form, Row, Col, message, Image
} from 'antd';
import { IPerformer } from 'src/interfaces';
import { ImageUpload } from '@components/file';
import { performerService, authService } from '@services/index';
import './performer.less';
import { injectIntl, IntlShape } from 'react-intl';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  user: IPerformer;
  intl: IntlShape
}

class PerformerVerificationForm extends PureComponent<IProps> {
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
    const { intl } = this.props;
    if (file && type === 'idFile') {
      this.idVerificationFileId = file?.response?.data?._id;
      this.setState({ idImage: file?.response?.data.url });
    }
    if (file && type === 'documentFile') {
      this.documentVerificationFileId = file?.response?.data?._id;
      this.setState({ documentImage: file?.response?.data.url });
    }
    message.success(intl.formatMessage({ id: 'photoHasBeenUploaded', defaultMessage: 'Photo has been uploaded!' }));
  }

  render() {
    const {
      intl
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
        labelAlign="left"
        className="account-form"
      >
        <Row>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              labelCol={{ span: 24 }}
              label={intl.formatMessage({ id: 'yourGovernmentIssuedId', defaultMessage: 'Your government issued ID' })}
              className="model-photo-verification"
            >
              <div className="document-upload">
                <ImageUpload accept="image/*" headers={headers} uploadUrl={`${documentUploadUrl}/idVerificationId`} onUploaded={this.onFileUploaded.bind(this, 'idFile')} />
                {idImage ? (
                  <Image alt="id-img" src={idImage} style={{ height: '150px' }} />
                ) : <img src="/static/front-id.png" height="150px" alt="id-img" />}
              </div>
              <div className="ant-form-item-explain" style={{ textAlign: 'left' }}>
                <ul className="list-issued-id">
                  <li>{intl.formatMessage({ id: 'governmentIssuedIdCard', defaultMessage: 'Government-issued ID card' })}</li>
                  <li>{intl.formatMessage({ id: 'nationalIdCard', defaultMessage: 'National Id card' })}</li>
                  <li>{intl.formatMessage({ id: 'passport', defaultMessage: 'Passport' })}</li>
                  <li>{intl.formatMessage({ id: 'drivingLicense', defaultMessage: 'Driving license' })}</li>
                </ul>
              </div>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              labelCol={{ span: 24 }}
              label={intl.formatMessage({ id: 'selfieImageUpload', defaultMessage: 'Your selfie with your ID and handwritten note' })}
              className="model-photo-verification"
            >
              <div className="document-upload">
                <ImageUpload accept="image/*" headers={headers} uploadUrl={`${documentUploadUrl}/documentVerificationId`} onUploaded={this.onFileUploaded.bind(this, 'documentFile')} />
                {documentImage ? (
                  <Image alt="id-img" src={documentImage} style={{ height: '150px' }} />
                ) : <img src="/static/holding-id.jpg" height="150px" alt="holding-id" />}
              </div>
              <div className="ant-form-item-explain" style={{ textAlign: 'left' }}>
                <ul className="list-issued-id">
                  <li>
                    {intl.formatMessage({
                      id: 'onABlankPieceOfWhitePaperWriteYourNameTodaysDateAndOurWebsiteAddress',
                      defaultMessage: 'On a blank piece of white paper write your name, today\'s date and our website address'
                    })}
                    {' '}
                    {window.location.hash}
                  </li>
                  <li>
                    {intl.formatMessage({
                      id: 'holdYourPaperAndYourIdSoWeCanClearlySeeHoth',
                      defaultMessage: 'Hold your paper and your ID so we can clearly see hoth'
                    })}
                  </li>
                  <li>
                    {intl.formatMessage({
                      id: 'takeASelfieOfYouYourIdAndYourHandwrittenNoteAllThreeElementsYouYourIdAndYourWritingMustBeClearlyVisibleWithoutCopyingOrEditing',
                      defaultMessage: 'Take a selfie of you, your ID and your handwritten note. All three elements (you, your ID and your writing) must be clearly visible without copying or editing'
                    })}
                  </li>
                </ul>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }
}

export default injectIntl(PerformerVerificationForm);
