import { Upload, message } from 'antd';
import { LoadingOutlined, PaperClipOutlined } from '@ant-design/icons';
import { PureComponent } from 'react';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('Image is too large please provide an image 5MB or below');
  }
  return isLt5M;
}

interface IState {
  loading: boolean;
}

interface IProps {
  imageUrl?: string;
  uploadUrl?: string;
  headers?: any;
  onUploaded: Function;
  options?: any;
  messageData?: any;
}

export class ImageMessageUpload extends PureComponent<IProps, IState> {
  state = {
    loading: false
  };

  handleChange = (info: any) => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      const { onUploaded } = this.props;
      this.setState({ loading: false });
      onUploaded && onUploaded({
        response: info.file.response
      });
    }
  };

  render() {
    const { options = {} } = this.props;
    const { loading } = this.state;

    const uploadButton = (
      <div>
        {loading ? <LoadingOutlined /> : <PaperClipOutlined />}
      </div>
    );
    const { headers, uploadUrl, messageData } = this.props;
    return (
      <Upload
        disabled={loading}
        accept={'image/*'}
        name={options.fieldName || 'file'}
        listType="picture-card"
        className="avatar-uploader"
        showUploadList={false}
        action={uploadUrl}
        beforeUpload={beforeUpload}
        onChange={this.handleChange}
        headers={headers}
        data={messageData}
      >
        {uploadButton}
      </Upload>
    );
  }
}
