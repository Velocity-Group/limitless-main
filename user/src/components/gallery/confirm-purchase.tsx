import { PureComponent } from 'react';
import { Button } from 'antd';
import { IGallery } from '@interfaces/index';

interface IProps {
  submiting: boolean;
  gallery: IGallery;
  onFinish: Function;
}

export class PurchaseGalleryForm extends PureComponent<IProps> {
  render() {
    const { gallery, onFinish, submiting } = this.props;
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
            Unlock Gallery:
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
            Unlock for &nbsp;
            <img
              alt="token"
              src="/static/coin-ico.png"
              height="15px"
              style={{ margin: '0 3px' }}
            />
            {(gallery?.price).toFixed(2)}
          </Button>
        </div>
      </div>
    );
  }
}
