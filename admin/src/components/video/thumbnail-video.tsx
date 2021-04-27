import { PureComponent } from 'react';
import { IVideoUpdate } from 'src/interfaces';

interface IProps {
  video?: IVideoUpdate;
  style?: Record<string, string>;
}

export class ThumbnailVideo extends PureComponent<IProps> {
  render() {
    const { video, style } = this.props;
    const { thumbnail, video: media } = video;
    const url = thumbnail || (media && media.thumbnails && media.thumbnails.length > 0
      ? media.thumbnails[0]
      : '/video.png');
    return <img alt="" src={url} style={style || { width: 65 }} />;
  }
}
