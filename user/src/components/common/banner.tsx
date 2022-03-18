import { PureComponent } from 'react';
import { Carousel, Image } from 'antd';

interface IProps {
  banners?: any;
}

export class Banner extends PureComponent<IProps> {
  render() {
    const { banners } = this.props;
    return (
      <div>
        {banners && banners.length > 0
        && (
        <Carousel effect="fade" adaptiveHeight autoplay swipeToSlide arrows dots={false}>
          {banners.map((item) => (
            // eslint-disable-next-line jsx-a11y/control-has-associated-label
            <a key={item._id} href={(item.link || null)} target="_.blank"><Image preview={false} src={item?.photo?.url} alt="banner" key={item._id} /></a>
          ))}
        </Carousel>
        )}
      </div>

    );
  }
}
