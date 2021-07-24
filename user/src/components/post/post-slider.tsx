import { PureComponent } from 'react';
import { Carousel, Spin, Image } from 'antd';
import { VideoPlayer } from '@components/common/video-player';
import './index.less';

interface IProps {
  feed: any
}

export default class FeedSlider extends PureComponent<IProps> {
  render() {
    const { feed } = this.props;
    const images = feed.files && feed.files.filter((f) => f.type === 'feed-photo');
    const videos = feed.files && feed.files.filter((f) => f.type === 'feed-video');
    let processing = false;
    videos && videos.forEach((f) => {
      if (f.status !== 'finished') {
        processing = true;
      }
    });

    return (
      <div className="feed-slider">
        {!processing && feed.files && feed.files.length && (
        <Carousel swipeToSlide arrows dots={false}>
          {images && images.length > 0 && images.map((img) => (
            <Image key={img._id} src={img.url} title={img.name} width="100%" alt="img" />
          ))}
          {videos && videos.length > 0 && videos.map((vid) => (
            <VideoPlayer
              key={vid._id}
              {...{
                autoplay: false,
                controls: true,
                playsinline: true,
                sources: [
                  {
                    src: vid.url,
                    type: 'video/mp4'
                  }
                ]
              }}
            />
          ))}
        </Carousel>
        )}
        {processing && (
        <div className="proccessing">
          <Spin />
          <p>Your media is currently proccessing</p>
        </div>
        )}
        {/* {feed.files && feed.files.length > 0 && <div className="count-media">
          {images.length > 0 && <span>{images.length} <FileImageOutlined /> </span>}
          {videos.length > 0 && images.length > 0 && '|'}
          {videos.length > 0 && <span>{videos.length} <VideoCameraOutlined /></span>}
        </div>} */}
      </div>
    );
  }
}
