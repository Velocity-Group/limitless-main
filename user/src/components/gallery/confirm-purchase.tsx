import { PureComponent } from 'react';
import { Button } from 'antd';
import { IGallery } from '@interfaces/index';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  submiting: boolean;
  gallery: IGallery;
  onFinish: Function;
  intl: IntlShape
}

class PurchaseGalleryForm extends PureComponent<IProps> {
  render() {
    const {
      gallery, onFinish, submiting, intl
    } = this.props;
    const image = gallery?.coverPhoto?.thumbnails[0] || '/static/no-image.jpg';

    return (
      <div className="text-center">
        <div className="tip-performer">
          <img
            alt="p-avt"
            src={image}
            style={{
              width: '220px',
              borderRadius: '5px',
              filter: 'blur(20px)',
              marginBottom: 10
            }}
          />
          <h4>
            {intl.formatMessage({ id: 'unlockGallery', defaultMessage: 'Unlock Gallery' })}
            :
            {' '}
            {gallery?.title}
          </h4>
          <p>{gallery?.description}</p>
        </div>
        <div className="text-center">
          <Button
            onClick={() => onFinish()}
            className="primary"
            type="primary"
            loading={submiting}
            disabled={submiting}
          >
            {intl.formatMessage({ id: 'unlockFor', defaultMessage: 'Unlock for' })}
            {' '}
            $
            {(gallery?.price || 0).toFixed(2)}
          </Button>
        </div>
      </div>
    );
  }
}
export default injectIntl(PurchaseGalleryForm);
