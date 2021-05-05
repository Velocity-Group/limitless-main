import { PureComponent } from 'react';
import {
  PictureOutlined,
  DeleteOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { Progress } from 'antd';

interface IProps {
  remove: Function;
  files: any[];
}

export default class UploadList extends PureComponent<IProps> {
  state = {
    previews: {} as Record<string, any>
  };

  renderPreview(file) {
    const { previews } = this.state;
    if (file.status === 'uploading') {
      return <LoadingOutlined />;
    }
    if (previews[file.uid]) {
      return <img alt="" src={previews[file.uid]} />;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const newpreviews = {
        ...previews,
        [file.uid]: reader.result
      };
      this.setState({ previews: newpreviews });
    });
    reader.readAsDataURL(file);
    return <PictureOutlined />;
  }

  render() {
    const { files, remove } = this.props;
    return (
      <div className="ant-upload-list ant-upload-list-picture">
        {files.length > 0 && files.map((file) => (
          <div
            className="ant-upload-list-item ant-upload-list-item-uploading ant-upload-list-item-list-type-picture"
            key={file.uid}
            style={{ height: 'auto' }}
          >
            <div className="ant-upload-list-item-info">
              <div>
                <span className="ant-upload-list-item-thumbnail ant-upload-list-item-file">
                  {this.renderPreview(file)}
                </span>
                <span className="ant-upload-list-item-name ant-upload-list-item-name-icon-count-1">
                  <span>
                    <b>{file.name}</b>
                  </span>
                  {' '}
                  |
                  {' '}
                  <span>
                    {(file.size / (1024 * 1024)).toFixed(2)}
                    {' '}
                    MB
                  </span>
                </span>
                {file.percent !== 100 && (
                  <span className="ant-upload-list-item-card-actions picture">
                    <a aria-hidden onClick={remove.bind(this, file)}>
                      <DeleteOutlined />
                    </a>
                  </span>
                )}
                {file.percent && (
                  <Progress percent={Math.round(file.percent)} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
