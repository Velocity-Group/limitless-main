import { PureComponent } from 'react';
import { IVideo } from 'src/interfaces';

interface IProps {
  video?: IVideo;
  style?: Record<string, string>;
}

export class ThumbnailVideo extends PureComponent<IProps> {
  render() {
    const { video, style } = this.props;
    const { thumbnail, video: media } = video;
    const url = media?.thumbnails[0] || thumbnail || '/video.png';
    return <img alt="" src={url} style={style || { width: 50 }} />;
  }
}
