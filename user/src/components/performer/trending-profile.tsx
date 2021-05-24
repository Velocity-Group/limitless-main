/* eslint-disable no-nested-ternary */
/* eslint-disable react/destructuring-assignment */
import { PureComponent } from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import { ITrendingPerformer } from 'src/interfaces';
import Link from 'next/link';
import './performer.less';

interface IProps {
  performer: ITrendingPerformer;
}

export default class PerformerTrendingCard extends PureComponent<IProps> {
  render() {
    const {
      performer
    } = this.props;
    const { ordering } = performer;

    return (
      <div
        className="trending-card"
        style={{ backgroundImage: (performer.cover && `url('${performer.cover}')`) || "url('/static/banner-image.jpg')" }}
        key={performer._id}
      >
        <Link
          href={{
            pathname: '/model/profile',
            query: { username: performer?.username || performer?._id }
          }}
          as={`/${performer?.username || performer?._id}`}
        >
          <div className="bg-2nd">
            <div className="trending-profile">
              <div className="profile-left">
                <img className="trending-avatar" alt="" src={performer?.avatar || '/static/no-avatar.png'} />
                <div className="m-user-name">
                  <h4>
                    {performer?.name}
                    &nbsp;
                    {performer?.verifiedAccount && (
                      <CheckCircleOutlined className="theme-color" />
                    )}
                  </h4>
                  <h5 style={{ textTransform: 'none' }}>
                    @
                    {performer?.username}
                  </h5>
                </div>
              </div>
              <div className="profile-right">
                <div className="ordering">
                  {[0, 1, 2].includes(ordering) && (
                  <span>
                    <img alt="top" src={ordering === 0 ? '/static/gold-medal.png' : ordering === 1 ? '/static/silver-medal.png' : '/static/bronze-medal.png'} />
                    trending
                  </span>
                  )}
                  {![0, 1, 2].includes(ordering) && (
                  <a>
                    {`#${(ordering || 0) + 1} trending`}
                  </a>
                  )}
                </div>
                <p className="bio">{performer?.bio}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }
}
