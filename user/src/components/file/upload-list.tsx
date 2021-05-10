/* eslint-disable no-nested-ternary */
import { PureComponent } from 'react';
import {
  DeleteOutlined, PictureOutlined
} from '@ant-design/icons';
import { Progress } from 'antd';

interface IProps {
  remove: Function;
  setCover: Function;
  files: any[];
}
export default class UploadList extends PureComponent<IProps> {
  state = {
    previews: {} as any
  }

  componentDidUpdate(prevProps) {
    const { files } = this.props;
    if (prevProps?.files.length !== files.length) {
      this.renderPreviews();
    }
  }

  renderPreviews = () => {
    const { files } = this.props;
    files.forEach((file) => {
      if (file._id) return;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.addEventListener('load', () => {
        const { previews } = this.state;
        const url = reader.result as string;
        this.setState({ previews: { ...previews, [file.uid]: url } });
      });
    });
  }

  render() {
    const { files, remove, setCover } = this.props;
    const { previews } = this.state;
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
                  {file._id ? <img src={file?.photo?.thumbnails[0]} alt="thumb" /> : file.uid ? <img alt="thumb" src={previews[file?.uid]} /> : <PictureOutlined />}
                </div>
                <div>
                  <p>{`${file?.name || file?.title} | ${((file?.size || file?.photo?.size) / (1024 * 1024)).toFixed(2)} MB`}</p>
                  <div>
                    {file.isGalleryCover && (
                      <a aria-hidden>
                        Cover IMG
                      </a>
                    )}
                    {!file.isGalleryCover && file._id && (
                      <a aria-hidden onClick={setCover.bind(this, file)}>
                        Set as Cover IMG
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
              {file.percent && (
                <Progress percent={Math.round(file.percent)} />
              )}
              {file._id && (
                <Progress percent={100} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
