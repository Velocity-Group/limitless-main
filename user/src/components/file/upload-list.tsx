/* eslint-disable no-nested-ternary */
import { PureComponent } from 'react';
import {
  DeleteOutlined, PictureOutlined, FileDoneOutlined
} from '@ant-design/icons';
import { Progress } from 'antd';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  remove: Function;
  setCover: Function;
  files: any[];
  intl:IntlShape
}
class PhotoUploadList extends PureComponent<IProps> {
  render() {
    const {
      files, remove, setCover, intl
    } = this.props;
    return (
      <div className="ant-upload-list ant-upload-list-picture">
        {files.length > 0 && files.map((file) => (
          <div
            className="ant-upload-list-item ant-upload-list-item-uploading ant-upload-list-item-list-type-picture"
            key={file._id || file.uid}
            style={{ height: 'auto' }}
          >
            <div className="photo-upload-list">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="photo-thumb">
                  {file._id && file?.photo?.thumbnails && file?.photo?.thumbnails[0] ? <img src={file?.photo?.thumbnails[0]} alt="thumb" /> : file.uid ? <img alt="thumb" src={file.thumbUrl} /> : <PictureOutlined />}
                </div>
                <div>
                  <p>
                    {`${file?.name || file?.title} | ${((file?.size || file?.photo?.size) / (1024 * 1024)).toFixed(2)} MB`}
                    {' '}
                    {file._id && <FileDoneOutlined style={{ color: 'green' }} />}
                  </p>
                  <div>
                    {file.isGalleryCover && (
                      <a aria-hidden>
                        {intl.formatMessage({ id: 'cover', defaultMessage: 'Cover' })}
                        {' '}
                        IMG
                      </a>
                    )}
                    {!file.isGalleryCover && file._id && (
                      <a aria-hidden onClick={setCover.bind(this, file)}>
                        {intl.formatMessage({ id: 'setAsCover', defaultMessage: 'Set as Cover' })}
                        IMG
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {file.percent !== 100 && (
                <a aria-hidden className="remove-photo" onClick={remove.bind(this, file)}>
                  <DeleteOutlined />
                </a>
              )}
              {file.percent ? (
                <Progress percent={Math.round(file.percent)} />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
export default injectIntl(PhotoUploadList);
