import { PureComponent } from 'react';
import { IPerformer } from 'src/interfaces';
import Link from 'next/link';
import { StarOutlined } from '@ant-design/icons';
import './performer.less';

interface IProps {
  performer: IPerformer;
}

export default class PerformerGridCard extends PureComponent<IProps> {
  render() {
    const { performer } = this.props;
    return (
      <div className="grid-card">
        <Link
          href={{
            pathname: '/model/profile',
            query: { username: performer?.username || performer?._id }
          }}
          as={`/${performer?.username || performer?._id}`}
        >
          <a>
            {performer.isFreeSubscription && <span className="free-status">Free</span>}
            <div className="card-img">
              <img alt="avatar" src={performer?.avatar || '/static/no-avatar.png'} />
            </div>
            <div className="card-stat">
              <span>
                {performer?.score || 0}
                {' '}
                <StarOutlined />
              </span>
            </div>
            <div className="model-name">{performer?.name || performer?.username || 'N/A'}</div>
          </a>
        </Link>
      </div>
    );
  }
}
