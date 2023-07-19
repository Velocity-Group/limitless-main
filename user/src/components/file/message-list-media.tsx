/* eslint-disable no-await-in-loop */
import { useEffect, useState, useCallback } from 'react';
import {
  PlayCircleOutlined, PlusOutlined, DeleteOutlined
} from '@ant-design/icons';
import {
  Progress, Button, Upload, Tooltip, message
} from 'antd';
import './index.less';
import { IntlShape, useIntl } from 'react-intl';

interface IProps {
  type: string;
  onFilesSelected: Function;
}

export const MessageUploadList = ({ type, onFilesSelected }: IProps) => {
  const [files, setFiles] = useState([]);
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({} as any), []);
  const intl: IntlShape = useIntl();

  const onBeforeUploadImage = async (file: any, _files: any) => {
    if (!file.type.includes('image')) {
      message.error(intl.formatMessage({ id: 'canOnlyUploadImageFiles', defaultMessage: 'Can only upload image files' }));
      return false;
    }
    const slFiles = [...files, ..._files].slice(0, 12); // limit 12
    if (slFiles.indexOf(file) > -1 && file.type.includes('image')) {
      const valid = file.size / 1024 / 1024 < 20;
      if (!valid) {
        message.error(
          `${file.name} ${intl.formatMessage({ id: 'onlySendImagesUnder20MB', defaultMessage: 'Only send images under 20MB!' })}`
        );
        return false;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        // eslint-disable-next-line no-param-reassign
        file.thumbnail = reader.result;
        forceUpdate();
      });
      reader.readAsDataURL(file);
    }
    if (_files.indexOf(file) === _files.length - 1) {
      if ([...files, ..._files].length > 12) {
        message.error(intl.formatMessage({ id: 'youCanOnlyUpload12Photos', defaultMessage: 'You can only upload 12 photos' }));
      }
      setFiles(slFiles);
      onFilesSelected(slFiles);
    }
    return true;
  };

  const onBeforeUploadVideo = async (file: any, _files: any) => {
    if (!file.type.includes('video')) {
      message.error(intl.formatMessage({ id: 'canOnlyUploadVideoFiles', defaultMessage: 'Can only upload video files' }));
      return false;
    }
    const slFiles = [...files, ..._files].slice(0, 12); // limit 12
    if (slFiles.indexOf(file) > -1 && file.type.includes('video')) {
      const valid = file.size / 1024 / 1024 < 1024;
      if (!valid) {
        message.error(`${intl.formatMessage({ id: 'video', defaultMessage: 'Video' })} ${file.name} ${intl.formatMessage({ id: 'mustBeLessThan1GB', defaultMessage: 'must be less than 1GB!' })}`);
        return false;
      }
    }
    if (_files.indexOf(file) === _files.length - 1) {
      setFiles(slFiles);
      onFilesSelected(slFiles);
    }
    return true;
  };

  const onRemove = (file) => {
    setFiles(files.filter((f) => f.uid !== file.uid));
    onFilesSelected(files.filter((f) => f.uid !== file.uid));
  };

  useEffect(() => {
    setFiles([]);
    onFilesSelected([]);
  }, [type]);

  return (
    <div className="f-upload-list message-upload-list">
      <div className="list-files">
        {files.map((file) => (
          <div className="f-upload-item" key={file._id || file.uid}>
            {/* eslint-disable-next-line no-nested-ternary */}
            {file.type.includes('image') ? (
              <span
                className="f-upload-thumb"
                style={{
                  backgroundImage: `url(${file?.thumbnail || file?.url || '/static/no-image.jpg'
                  })`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            ) : file.type.includes('video') ? (
              <span
                style={{
                  backgroundImage: `url(${(file?.thumbnails && file?.thumbnails[0])})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                className="f-thumb-vid"
                aria-hidden
              >
                <PlayCircleOutlined />
              </span>
            ) : (
              <span
                className="f-upload-thumb"
                style={{
                  backgroundImage: `url(${'/static/no-image.jpg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            )}
            <div className="desc-video-upload">
              <div className="f-upload-name">
                <Tooltip title={file?.name}>{file?.name}</Tooltip>
              </div>
              <div className="f-upload-size">
                {((file?.size || 0) / (1024 * 1024)).toFixed(2)}
                {' '}
                MB
              </div>
            </div>

            {file.status !== 'uploading' && (
            <span className="f-remove">
              <Button
                type="primary"
                onClick={() => onRemove(file)}
              >
                <DeleteOutlined />
              </Button>
            </span>
            )}
            {file.percent && <Progress percent={Math.round(file?.percent)} />}
          </div>
        ))}
        {((type === 'photo' && files.length < 12) || (type === 'video' && !files.length)) && (
        <div className="add-more">
          <Upload
            maxCount={12}
            customRequest={() => true}
            accept={type === 'video' ? 'video/*' : 'image/*'}
            beforeUpload={type === 'video' ? onBeforeUploadVideo : onBeforeUploadImage}
            multiple={type === 'photo'}
            showUploadList={false}
            listType="picture"
          >
            <PlusOutlined />
          </Upload>
        </div>
        )}
      </div>
    </div>
  );
};
