import { PureComponent } from 'react';
import { Upload, message } from 'antd';
import { LoadingOutlined, EditOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import { getGlobalConfig } from '@services/config';
import { injectIntl, IntlShape } from 'react-intl';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
  const config = getGlobalConfig();
  const isLt2M = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5);
  if (!isLt2M) {
    message.error(`Cover must be less than ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB`);
  }
  return isLt2M;
}

interface IState {
  loading: boolean;
}

interface IProps {
  image?: string;
  uploadUrl?: string;
  headers?: any;
  onUploaded?: Function;
  options?: any;
  intl: IntlShape
}

class CoverUpload extends PureComponent<IProps, IState> {
  state = {
    loading: false
  };

  handleChange = (info) => {
    const { onUploaded } = this.props;
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, (imageUrl) => {
        this.setState({
          loading: false
        });
        onUploaded
          && onUploaded({
            response: info.file.response,
            base64: imageUrl
          });
      });
    }
  };

  onPreview = async (file) => {
    let src = file.url;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow.document.write(image.outerHTML);
  };

  render() {
    const { loading } = this.state;
    const {
      headers, uploadUrl, options, intl
    } = this.props;
    return (
      <ImgCrop aspect={4.5 / 1} shape="rect" quality={1} modalTitle={intl.formatMessage({ id: 'editCoverImage', defaultMessage: 'Edit cover image' })} modalWidth={767}>
        <Upload
          accept="image/*"
          name={options.fieldName || 'file'}
          listType="picture-card"
          showUploadList={false}
          action={uploadUrl}
          beforeUpload={beforeUpload}
          onChange={this.handleChange}
          onPreview={this.onPreview}
          headers={headers}
        >
          {loading ? <LoadingOutlined /> : <EditOutlined />}
          {' '}
          {intl.formatMessage({ id: 'editCover', defaultMessage: 'Edit cover' })}
        </Upload>
      </ImgCrop>
    );
  }
}
export default injectIntl(CoverUpload);
