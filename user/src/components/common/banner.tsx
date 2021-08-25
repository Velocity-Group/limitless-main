import { PureComponent } from 'react';
import { Carousel } from 'antd';

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
        <Carousel effect="fade" autoplay swipeToSlide arrows dots={false}>
          {banners.map((item) => (
            // eslint-disable-next-line jsx-a11y/control-has-associated-label
            <a href={(item.link || '#')} target="_.blank"><img src={item.photo && item.photo.url} alt="" key={item._id} /></a>
          ))}
        </Carousel>
        )}
      </div>

    );
  }
}
