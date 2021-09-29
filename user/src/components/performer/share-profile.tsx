import { IPerformer } from '@interfaces/index';
import {
  FacebookShareButton, TwitterShareButton, TwitterIcon, FacebookIcon
} from 'react-share';
import './performer.less';

interface IProps {
  performer: IPerformer;
  siteName: string;
}

const SocialSharePerformer = ({ performer, siteName }: IProps) => {
  const shareUrl = `${window.location.origin}/${performer?.username || performer?._id}`;
  return (
    <div className="social-share-btns">
      <FacebookShareButton url={shareUrl} quote={performer?.bio || ''} hashtag={`#${performer?.username} #${performer?.name}`}>
        <FacebookIcon size={40} round />
      </FacebookShareButton>
      <TwitterShareButton url={shareUrl} title={performer?.bio || ''} hashtags={[siteName, performer?.username, performer?.name]}>
        <TwitterIcon size={40} round />
      </TwitterShareButton>
    </div>
  );
};

export default SocialSharePerformer;
