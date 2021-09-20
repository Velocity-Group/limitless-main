/* eslint-disable react/no-array-index-key */
import { PureComponent } from 'react';
import { IVideoResponse } from 'src/interfaces';
import './video.less';

interface IProps {
  video: IVideoResponse;
  style?: any;
}

export class ThumbnailVideo extends PureComponent<IProps> {
  render() {
    const { video: videoProp, style } = this.props;
    const { thumbnail, video, teaser } = videoProp;
    const url = (thumbnail?.thumbnails && thumbnail?.thumbnails[0]) || thumbnail?.url || (teaser?.thumbnails && teaser?.thumbnails[0]) || (video?.thumbnails && video?.thumbnails[0]) || '/static/no-image.jpg';
    return (
      <img alt="thumbnail" src={url} style={style || { width: '50px' }} />
    );
  }
}
