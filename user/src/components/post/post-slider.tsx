import { PureComponent } from 'react';
import {
  Carousel, Spin, Image
} from 'antd';
import { VideoPlayer } from '@components/common/video-player';
import { AudioPlayer } from '@components/common/audio-player';
// import { FileImageOutlined, VideoCameraOutlined, AudioOutlined } from '@ant-design/icons';
import './index.less';
import { IFeed } from '@interfaces/feed';

interface IProps {
  feed: IFeed;
}

export default class FeedSlider extends PureComponent<IProps> {
  state = {
    openPreviewImage: false,
    previewIndex: 0
  }

  render() {
    const { feed } = this.props;
    const { openPreviewImage, previewIndex } = this.state;
    const images = feed.files && feed.files.filter((f) => f.type === 'feed-photo');
    const videos = feed.files && feed.files.filter((f) => f.type === 'feed-video');
    const audios = feed.files && feed.files.filter((f) => f.type === 'feed-audio');
    let processing = false;
    videos && videos.forEach((f) => {
      if (f.status !== 'finished') {
        processing = true;
      }
    });
    audios && audios.forEach((f) => {
      if (f.status !== 'finished') {
        processing = true;
      }
    });

    return (
      <div className={feed.type === 'audio' ? 'feed-slider custom' : 'feed-slider'}>
        {!processing && feed.files && feed.files.length && (
          <>
            {images && images.length > 0 && (
            <Carousel swipeToSlide arrows dots={false}>
              {images.map((img, index) => (
                <Image
                  key={img._id}
                  src={img.url}
                  preview={{ visible: false }}
                  fallback="/static/no-image.jpg"
                  title={img.name}
                  width="100%"
                  alt="img"
                  onClick={() => this.setState({ openPreviewImage: true, previewIndex: index })}
                />
              ))}
            </Carousel>
            )}
            <div style={{ display: 'none' }}>
              <Image.PreviewGroup preview={{ current: previewIndex, visible: openPreviewImage, onVisibleChange: (vis) => this.setState({ openPreviewImage: vis }) }}>
                {images.map((img) => (
                  <Image
                    key={img._id}
                    src={img.url}
                    preview={{ visible: false }}
                    fallback="/static/no-image.jpg"
                    title={img.name}
                    width="100%"
                    alt="img"
                  />
                ))}
              </Image.PreviewGroup>
            </div>
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
            {audios && audios.length > 0 && audios.map((audio) => <AudioPlayer key={audio._id} source={audio?.url} />)}
          </>
        )}
        {processing && (
        <div className="proccessing">
          <Spin />
          <p>Your media is currently proccessing</p>
        </div>
        )}
      </div>
    );
  }
}
