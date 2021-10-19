import { PureComponent } from 'react';
import { FileAddOutlined, DeleteOutlined } from '@ant-design/icons';
import { Progress } from 'antd';
import './index.less';

interface IProps {
  remove: Function;
  files: any[];
}

export default class VideoUploadList extends PureComponent<IProps> {
  render() {
    const { files, remove } = this.props;
    return (
      <div className="ant-upload-list ant-upload-list-picture">
        {files.map((file) => (
          <div className="ant-upload-list-item ant-upload-list-item-uploading ant-upload-list-item-list-type-picture" key={file.uid}>
            <div className="ant-upload-list-item-info">
              <span className="ant-upload-list-item-thumbnail ant-upload-list-item-file">
                <FileAddOutlined />
              </span>
              <span className="ant-upload-list-item-name ant-upload-list-item-name-icon-count-1">
                <span><b>{file.name}</b></span>
                {' '}
                |
                <span>
                  {(file.size / (1024 * 1024)).toFixed(2)}
                  {' '}
                  MB
                </span>
              </span>
              {file.percent !== 100
                  && (
                    <a aria-hidden className="ant-upload-list-item-card-actions picture" onClick={remove.bind(this, file)}>
                      <DeleteOutlined />
                    </a>
                  )}
            </div>
            {file.percent && <Progress percent={Math.round(file.percent)} />}
          </div>
        ))}
      </div>
    );
  }
}
