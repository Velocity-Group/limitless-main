/* eslint-disable no-await-in-loop */
import { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Input, Popover, Button, message, Modal, Upload
} from 'antd';
import {
  SwapOutlined, UploadOutlined, DeleteOutlined,
  PictureOutlined, VideoCameraAddOutlined, DollarOutlined,
  AudioOutlined, SmileOutlined
} from '@ant-design/icons';
import { messageService } from '@services/index';
import { MessageUploadList } from '@components/file/message-list-media';
import { IConversation } from 'src/interfaces';
import { sendMessageSuccess, deactiveConversation } from '@redux/message/actions';
import { convertBlobUrlToFile } from '@lib/index';
import { AudioPlayer } from '@components/common';
import { IntlShape, useIntl } from 'react-intl';
import Emotions from './emotions';
import { MessagePriceForm } from './set-price-form';
import { AudioRecorder } from './audio-recorder';
import './Compose.less';

interface IProps {
  conversation: IConversation;
  disabled: boolean;
}

function Compose({ conversation, disabled }: IProps) {
  const user = useSelector((state: any) => state.user.current);
  const [mediaType, setMediaType] = useState('text');
  const [openMediaUpload, setOpenUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [openPriceModal, setOpenPriceModal] = useState(false);
  const [isSale, setSale] = useState(false);
  const [price, setPrice] = useState(null);
  const [teaserFile, setTeaser] = useState(null);
  const [thumbnailFile, setThumbnail] = useState(null);
  const [audioFile, setAudio] = useState(null);
  const [openAudioRecorder, setOpenAudio] = useState(false);
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({} as any), []);
  const dispatch = useDispatch();
  const intl: IntlShape = useIntl();
  const _input = useRef() as any;

  const resetState = () => {
    setMediaType('text');
    setOpenUpload(false);
    setSubmitting(false);
    setText('');
    setFiles([]);
    setSale(false);
    setPrice(null);
    setTeaser(null);
    setAudio(null);
    setThumbnail(null);
  };

  const onUploading = (file, resp: any) => {
    // eslint-disable-next-line no-param-reassign
    file.percent = resp.percentage;
    // eslint-disable-next-line no-param-reassign
    if (file.percent === 100) file.status = 'done';
    forceUpdate();
  };

  const onSubmit = async () => {
    if (openMediaUpload && !files.length) {
      message.error(intl.formatMessage({ id: 'selectAMedia', defaultMessage: 'Select a media' }));
      return;
    }
    if (!text) {
      message.error(intl.formatMessage({ id: 'enterYourMessage', defaultMessage: 'Enter your message' }));
      return;
    }
    setSubmitting(true);
    try {
      const fileIds = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const fileItem of files) {
        // eslint-disable-next-line no-continue
        if (['uploading', 'done'].includes(fileItem.status) || fileItem._id) continue;
        fileItem.status = 'uploading';
        let resp = null;
        if (fileItem.type.indexOf('image') > -1 && user.isPerformer && isSale) {
          resp = await messageService.uploadPrivatePhoto(
            fileItem,
            {},
            (r) => onUploading(fileItem, r)
          );
        } else if ((fileItem.type.indexOf('image') > -1 && !user.isPerformer) || (fileItem.type.indexOf('image') > -1 && user.isPerformer && !isSale)) {
          resp = await messageService.uploadPublicPhoto(
            fileItem,
            {},
            (r) => onUploading(fileItem, r)
          );
        } else {
          resp = await messageService.uploadVideo(
            fileItem,
            {},
            (r) => onUploading(fileItem, r)
          );
        }
        fileItem.status = 'done';
        fileIds.push(resp.data._id);
      }
      const teaser = teaserFile && await messageService.uploadTeaser(teaserFile,
        {},
        () => null) as any;
      teaser && fileIds.push(teaser.data._id);
      const thumbnail = thumbnailFile && await messageService.uploadPublicThumbnail(thumbnailFile,
        {},
        () => null) as any;
      thumbnail && fileIds.push(thumbnail.data._id);
      const _convertedBlobAudioFile = audioFile && await convertBlobUrlToFile(audioFile, `message_audio_${new Date().getTime()}`);
      const audio = audioFile && await messageService.uploadAudio(_convertedBlobAudioFile,
        {},
        () => null) as any;
      audio && fileIds.push(audio.data._id);
      const resp = await messageService.sendMessage(conversation._id, {
        text,
        fileIds,
        isSale,
        price: !isSale ? 0 : price,
        type: mediaType
      });
      resetState();
      _input.current && _input.current.focus();
      dispatch(sendMessageSuccess(resp.data));
    } catch (e) {
      setSubmitting(false);
      const err = await e;

      if (err?.message === 'Entity is not found') {
        message.error(intl.formatMessage({ id: 'notFound', defaultMessage: 'Not found' }));
      } else {
        message.error(err?.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
      }
    }
  };

  const onKeyDown = (evt) => {
    if (evt.keyCode === 13) {
      onSubmit();
    }
  };

  const onChangeSale = (data) => {
    setSale(data.isSale);
    setPrice(data.price);
    setOpenPriceModal(false);
  };

  const handleOpenUpload = (t: 'video' | 'photo') => {
    if (mediaType === t) {
      setOpenUpload(false);
      setMediaType('text');
    } else {
      setMediaType(t);
      setOpenUpload(true);
      if (t === 'photo') {
        setTeaser(null);
      }
      if (t === 'video') {
        setThumbnail(null);
      }
    }
  };

  const onSelectTeaser = (file) => {
    const valid = file.size / 1024 / 1024 < 100;
    if (!valid) {
      message.error(intl.formatMessage({ id: 'theTeaserMustBeLessThan100MB', defaultMessage: 'The teaser must be less than 100 MB!' }));
      return false;
    }
    setTeaser(file);
    return true;
  };

  const onSelectThumbnail = (file) => {
    const valid = file.size / 1024 / 1024 < 20;
    if (!valid) {
      message.error(intl.formatMessage({ id: 'thumbnailMustBeLessThan20MB', defaultMessage: 'Thumbnail must be less than 20 MB!' }));
      return false;
    }
    setThumbnail(file);
    return true;
  };

  const onDiscard = () => {
    dispatch(deactiveConversation(conversation._id));
  };

  return (
    <div className="message-compose-form">
      {user.isPerformer && ['photo', 'video'].includes(mediaType) && (
        <div className="top-btn-groups">
          <Button disabled={submitting} className={(teaserFile || thumbnailFile) ? 'preview-btn active' : 'preview-btn'}>
            {(teaserFile || thumbnailFile) ? (
              <Upload
                customRequest={() => true}
                accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                beforeUpload={(f) => (mediaType === 'video' ? onSelectTeaser(f) : onSelectThumbnail(f))}
                multiple={false}
                showUploadList={false}
                listType="picture"
              >
                <SwapOutlined />
                {intl.formatMessage({ id: 'changePreview', defaultMessage: 'Change preview' })}
              </Upload>
            ) : (
              <Upload
                customRequest={() => true}
                accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                beforeUpload={(f) => (mediaType === 'video' ? onSelectTeaser(f) : onSelectThumbnail(f))}
                multiple={false}
                showUploadList={false}
                listType="picture"
              >
                <UploadOutlined />
                {intl.formatMessage({ id: 'insertPreview', defaultMessage: 'Insert preview' })}
              </Upload>
            )}
          </Button>
          {!conversation?.recipientInfo?.isPerformer && <Button disabled={submitting} onClick={() => setOpenPriceModal(true)} className={isSale ? 'sale-btn active' : 'sale-btn'}>{!isSale ? intl.formatMessage({ id: 'public', defaultMessage: 'Public' }) : `$${price}`}</Button>}
        </div>
      )}
      {openMediaUpload && <MessageUploadList onFilesSelected={(_files) => setFiles(_files)} type={mediaType} />}
      <Input.TextArea
        className="compose-text-area"
        placeholder={intl.formatMessage({ id: 'message', defaultMessage: 'Message' })}
        rows={3}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        value={text}
        maxLength={500}
        onKeyDown={onKeyDown}
        disabled={disabled || submitting}
        ref={_input}
      />
      {audioFile && (
        <div className="audio-player">
          <AudioPlayer source={audioFile} />
          {' '}
          <Button onClick={() => setAudio(null)}><DeleteOutlined /></Button>
        </div>
      )}
      <AudioRecorder isActive={openAudioRecorder} onFinish={(file) => { setAudio(file); }} onClose={() => setOpenAudio(false)} />
      <div className="bottom-btn-groups">
        <div className="grp-left">
          <Button disabled={disabled || submitting} onClick={() => handleOpenUpload('photo')} className={mediaType === 'photo' ? 'active' : ''}><PictureOutlined /></Button>
          {user.isPerformer && (
            <>
              <Button disabled={disabled || submitting} onClick={() => handleOpenUpload('video')} className={mediaType === 'video' ? 'active' : ''}><VideoCameraAddOutlined /></Button>
              {!conversation?.recipientInfo?.isPerformer && <Button disabled={disabled || submitting} onClick={() => setOpenPriceModal(true)} className={openPriceModal ? 'active' : ''}><DollarOutlined /></Button>}
              <Button disabled={disabled || submitting} onClick={() => setOpenAudio(!openAudioRecorder)} className={openAudioRecorder ? 'active' : ''}><AudioOutlined /></Button>
            </>
          )}
          <Popover
            destroyTooltipOnHide={false}
            className="emotion-popover"
            content={(
              <Emotions onEmojiClick={(emoji) => setText(`${text} ${emoji} `)} />
            )}
            trigger="click"
          >
            <Button disabled={disabled || submitting}><SmileOutlined /></Button>
          </Popover>
        </div>
        <div className="grp-right">
          <Button className="secondary" onClick={() => onDiscard()} disabled={submitting}>{intl.formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}</Button>
          <Button disabled={disabled || submitting} loading={submitting} className="primary" onClick={() => onSubmit()}>{intl.formatMessage({ id: 'send', defaultMessage: 'Send' })}</Button>
        </div>
      </div>
      <Modal
        key="tip_performer"
        className="message-price-modal"
        title={null}
        width={500}
        visible={openPriceModal}
        onOk={() => setOpenPriceModal(false)}
        footer={null}
        onCancel={() => setOpenPriceModal(false)}
      >
        <MessagePriceForm
          price={price}
          isSale={isSale}
          onFinish={onChangeSale}
          onClose={() => setOpenPriceModal(false)}
        />
      </Modal>
    </div>
  );
}

export default Compose;
