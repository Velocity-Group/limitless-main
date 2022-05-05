import { Upload, message } from 'antd';
import { LoadingOutlined, CameraOutlined } from '@ant-design/icons';
import { PureComponent } from 'react';
import { getGlobalConfig } from '@services/config';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

interface IState {
  loading: boolean;
  imageUrl: string;
}

interface IProps {
  accept?: string;
  imageUrl?: string;
  uploadUrl?: string;
  headers?: any;
  onUploaded?: Function;
  onFileReaded?: Function;
  options?: any;
}

export class ImageUploadModel extends PureComponent<IProps, IState> {
  state = {
    loading: false,
    imageUrl: ''
  };

  componentDidMount() {
    const { imageUrl } = this.props;
    this.setState({ imageUrl });
  }

  beforeUpload(file) {
    const { onFileReaded } = this.props;
    const config = getGlobalConfig();
    const isLt5M = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 20);
    if (!isLt5M) {
      message.error(`Image is too large please provide an image ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 20}MB or below`);
      return false;
    }
    getBase64(file, (imageUrl) => {
      this.setState({
        imageUrl
      });
    });
    onFileReaded && onFileReaded(file);
    return true;
  }

  render() {
    const {
      options = {}, accept, headers, uploadUrl
    } = this.props;
    const { imageUrl, loading } = this.state;
    const uploadButton = (
      <div>
        {loading ? <LoadingOutlined /> : <CameraOutlined />}
      </div>
    );
    return (
      <Upload
        customRequest={() => false}
        accept={accept || 'image/*'}
        name={options.fieldName || 'file'}
        listType="picture-card"
        className="avatar-uploader"
        showUploadList={false}
        action={uploadUrl}
        beforeUpload={(file) => this.beforeUpload(file)}
        headers={headers}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="file" style={{ width: '100%' }} />
        ) : (
          uploadButton
        )}
      </Upload>
    );
  }
}
