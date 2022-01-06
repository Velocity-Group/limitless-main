/* eslint-disable no-nested-ternary */
import { PureComponent } from 'react';
import { DeleteOutlined, PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import {
  Progress, Button, Upload, Tooltip
} from 'antd';
import '../feed/index.less';

interface IProps {
  remove: Function;
  files: any[];
  onAddMore: Function;
  uploading: boolean;
  type?: string;
}
export default class UploadList extends PureComponent<IProps> {
  beforeUpload(file, fileList) {
    const { onAddMore: handleAddMore } = this.props;
    handleAddMore(file, fileList);
  }

  render() {
    const {
      files, remove: handleRemove, uploading, type
    } = this.props;
    return (
      <div className="f-upload-list">
        {files && files.map((file) => (
          <div className="f-upload-item" key={file._id || file.uid}>
            <div className="f-upload-thumb">
              {(file.type.includes('feed-photo') || file.type.includes('image'))
                ? <a href={file.url} target="_blank" rel="noreferrer"><img alt="img" src={file.url ? file.url : file.thumbnail} width="100%" /></a>
                : file.type.includes('video') ? (
                  <a href={file.url} target="_blank" rel="noreferrer">
                    <span className="f-thumb-vid">
                      <PlayCircleOutlined />
                    </span>
                  </a>
                ) : <a href={file.url} target="_blank" rel="noreferrer"><img alt="img" src="/placeholder-image.jpg" width="100%" /></a>}
            </div>
            <div className="f-upload-name">
              <Tooltip title={file.name}>{file.name}</Tooltip>
            </div>
            <div className="f-upload-size">
              {(file.size / (1024 * 1024)).toFixed(2)}
              {' '}
              MB
            </div>
            {file.status !== 'uploading'
              && (
              <span className="f-remove">
                <Button type="primary" onClick={handleRemove.bind(this, file)}>
                  <DeleteOutlined />
                </Button>
              </span>
              )}
            {file.percent && <Progress percent={Math.round(file.percent)} />}
          </div>
        ))}
        {(type === 'photo' || (type === 'video' && !files.length)) && (
        <div className="add-more">
          <Upload
            customRequest={() => true}
            accept={type === 'video' ? 'video/*' : 'image/*'}
            beforeUpload={this.beforeUpload.bind(this)}
            multiple={type === 'photo'}
            showUploadList={false}
            disabled={uploading}
            listType="picture"
          >
            <PlusOutlined />
            {' '}
            {type === 'photo' ? 'photos' : type === 'video' ? 'video' : 'files'}
          </Upload>
        </div>
        )}
      </div>
    );
  }
}
