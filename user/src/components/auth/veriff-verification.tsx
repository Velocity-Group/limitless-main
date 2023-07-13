/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import {
  Row, Col, Form, Image, message, Result, Spin, Button
} from 'antd';
import { authService, performerService, userService } from 'src/services';
import { ImageUpload } from '@components/file';
import * as VeriffSDK from '@veriff/js-sdk';
import { IPerformer, ISettings } from 'src/interfaces';
import { useDispatch, useSelector } from 'react-redux';
import { updateCurrentUser } from '@redux/user/actions';
import { IntlShape, useIntl } from 'react-intl';

interface IProps {
  performer: IPerformer
}
const sdk = VeriffSDK as any;

const IdVerificationForm = ({ performer }: IProps) => {
  const [idPhotoUrl, setIdPhoto] = useState(performer?.idVerification?.url);
  const [selfiePhotoUrl, setSelfiePhoto] = useState(performer?.documentVerification?.url);
  const settings = useSelector((state: any) => state.settings) as ISettings;
  const documentUploadUrl = performerService.getDocumentUploadUrl();
  const [verification, setVerification] = useState(null);
  const [fetching, setFetching] = useState(true);
  const dispatch = useDispatch();
  const intl: IntlShape = useIntl();

  const veriff = sdk.Veriff({
    host: settings?.veriffBaseUrl,
    apiKey: settings.veriffPublicKey,
    parentId: 'veriff-root',
    onSession: async (err, response) => {
      // received the response, verification can be started / triggered now
      if (err || !response || !response?.verification?.url) return;

      try {
        // save response data to this performer verification
        await authService.generateVeriff({
          sessionId: response?.verification?.id,
          status: response?.verification?.status,
          responseData: response?.verification
        });
        window.location.href = response?.verification?.url;
      } catch (error) {
        const e = await error;
        message.error(e?.message);
      }
    }
  });
  veriff.setParams({
    person: {
      givenName: performer?.firstName || '',
      lastName: performer?.lastName || ''
    },
    vendorData: performer?.email || ' ' // should be ' ' for blank
  });

  const headers = {
    authorization: authService.getToken()
  };

  const updateProfile = async () => {
    const resp = await userService.me();
    dispatch(updateCurrentUser(resp.data));
    resp.data.verifiedDocument && setFetching(false);
    !resp.data.verifiedDocument && setTimeout(() => updateProfile(), 10000);
  };

  const getIdentity = async () => {
    const resp = await authService.getDecision();
    resp.data && setVerification(resp.data);
  };

  const onFileUploaded = (file, type) => {
    if (file && type === 'idFile') {
      setIdPhoto(file?.response?.data.url);
    }
    if (file && type === 'documentFile') {
      setSelfiePhoto(file?.response?.data.url);
    }
    message.success(intl.formatMessage({ id: 'photoHasBeenUploaded', defaultMessage: 'Photo has been uploaded!' }));
  };

  useEffect(() => {
    getIdentity();
    updateProfile();
    veriff.mount({
      formLabel: {
        givenName: 'First name',
        lastName: 'Last name'
      },
      loadingText: 'Loading...'
    });
  }, []);

  return (
    <div style={{ paddingBottom: 50 }}>
      <Result
        status={performer?.verifiedDocument ? 'success' : '404'}
        title={(
          <div>
            {intl.formatMessage({ id: 'status', defaultMessage: 'Status' })}
            :
            {' '}
            <b color="pink">{performer?.verifiedDocument ? intl.formatMessage({ id: 'verified', defaultMessage: 'Verified!' }) : intl.formatMessage({ id: 'notVerifiedYet', defaultMessage: 'Not verified yet!' })}</b>
            &nbsp;
            {fetching && <Spin />}
          </div>
        )}
        subTitle={performer?.verifiedDocument ? intl.formatMessage({ id: 'congratsYourIDDocumentsHaveBeenVerifiedYouCanStartPostingContentNow', defaultMessage: 'Congrats! Your ID documents have been verified, you can start posting content now' }) : intl.formatMessage({ id: 'verifyYourIDToStartPostingContent', defaultMessage: 'Verify your ID to start posting content!' })}
      />
      {(!settings?.veriffEnabled || !settings?.veriffPublicKey)
        && (
          <>
            <h3 className="text-center">
              {intl.formatMessage({ id: 'veriffIsDisabledPleaseTryAgainLater', defaultMessage: 'Veriff is disabled, please try again later!' })}
            </h3>
            {(!performer?.verifiedDocument) && (
              <Row>
                <Col xs={24} sm={24} md={12}>
                  <Form.Item
                    labelCol={{ span: 24 }}
                    label={intl.formatMessage({ id: 'yourGovernmentIssuedId', defaultMessage: 'Your government issued ID' })}
                    className="model-photo-verification"
                  >
                    <div className="document-upload">
                      <ImageUpload accept="image/*" headers={headers} uploadUrl={`${documentUploadUrl}/idVerificationId`} onUploaded={(file) => onFileUploaded(file, 'idFile')} />
                      {idPhotoUrl ? (
                        <Image alt="id-img" src={idPhotoUrl} style={{ height: '150px' }} />
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
                      <ImageUpload accept="image/*" headers={headers} uploadUrl={`${documentUploadUrl}/documentVerificationId`} onUploaded={(file) => onFileUploaded(file, 'documentFile')} />
                      {selfiePhotoUrl ? (
                        <Image alt="id-img" src={selfiePhotoUrl} style={{ height: '150px' }} />
                      ) : <img src="/static/holding-id.jpg" height="150px" alt="holding-id" />}
                    </div>
                    <div className="ant-form-item-explain" style={{ textAlign: 'left' }}>
                      <ul className="list-issued-id">
                        <li>
                          {intl.formatMessage({ id: 'onABlankPieceOfWhitePaperWriteYourNameTodaysDateAndOurWebsiteAddress', defaultMessage: 'On a blank piece of white paper write your name, today\'s date and our website address' })}
                        </li>
                        <li>{intl.formatMessage({ id: 'holdYourPaperAndYourIdSoWeCanClearlySeeHoth', defaultMessage: 'Hold your paper and your ID so we can clearly see hoth' })}</li>
                        <li>{intl.formatMessage({ id: 'takeASelfieOfYouYourIdAndYourHandwrittenNoteAllThreeElementsYouYourIdAndYourWritingMustBeClearlyVisibleWithoutCopyingOrEditing', defaultMessage: 'Take a selfie of you, your ID and your handwritten note. All three elements (you, your ID and your writing) must be clearly visible without copying or editing' })}</li>
                      </ul>
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            )}
          </>
        )}
      {settings?.veriffEnabled && settings?.veriffPublicKey && !performer?.verifiedDocument && (
        <div style={{
          display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center'
        }}
        >
          {(verification?.status === 'review' || verification?.status === 'submitted') && (
            <h3 className="text-center">
              {intl.formatMessage({ id: 'theIdentityIsNowBeingReviewedPleaseWait', defaultMessage: 'The Identity is now being reviewed, please wait!' })}
            </h3>
          )}
          {verification?.status === 'declined' && (
            <h3 className="text-center">
              {intl.formatMessage({ id: 'theIdentityIsDeclinedPleaseTryANewOneByClickingTheButtonBellow', defaultMessage: 'The Identity is declined, please try a new one by clicking the button bellow' })}
            </h3>
          )}
          {(verification?.status === 'expired' || verification?.status === 'abandoned') && (
            <h3 className="text-center">
              {intl.formatMessage({ id: 'theIdentityIsExpiredPleaseTryANewOneByClickingTheButtonBellow', defaultMessage: 'The Identity is expired, please try a new one by clicking the button bellow' })}
            </h3>
          )}
          {/* Veriff redirect button */}
          {(!verification || (verification?.status !== 'approved' && verification?.status !== 'submitted')) && (
            <div id="veriff-root" style={{ width: 400 }} />
          )}
        </div>
      )}
    </div>
  );
};

export default IdVerificationForm;
