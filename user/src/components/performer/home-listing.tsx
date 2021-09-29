import { Carousel } from 'antd';
import { PureComponent } from 'react';
import { IPerformer } from 'src/interfaces';
import { chunk } from 'lodash';
import PerformerCard from './card';
import './performer.less';

interface IProps {
  performers: IPerformer[]
}

export class HomePerformers extends PureComponent<IProps> {
  render() {
    const { performers } = this.props;
    const chunkPerformers = chunk(performers, 3);
    return (
      <div className="sug-content">
        <Carousel swipeToSlide arrows dots={false}>
          {chunkPerformers.length > 0 && chunkPerformers.map((arr: any, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`newaa_${index}`}>
              {arr.length > 0 && arr.map((p) => <PerformerCard performer={p} key={p._id} />)}
            </div>
          ))}
        </Carousel>
      </div>
    );
  }
}
