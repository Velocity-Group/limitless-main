import { PureComponent } from 'react';
import { Spin } from 'antd';
import CommentItem from '@components/comment/comment-item';
import { IComment, IUser } from 'src/interfaces/index';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  comments: IComment[];
  total?: number;
  requesting: boolean;
  onDelete?: Function;
  user?: IUser;
  canReply?: boolean
  intl: IntlShape
}

class ListComments extends PureComponent<IProps> {
  render() {
    const {
      comments, requesting, user, onDelete, canReply, intl
    } = this.props;

    return (
      <div className="cmt-list">
        {comments.map((comment: IComment) => <CommentItem canReply={canReply} key={comment._id} item={comment} user={user} onDelete={onDelete} />)}
        {requesting && <div className="text-center" style={{ margin: 20 }}><Spin /></div>}
        {!requesting && !comments.length && (
          <div className="text-center" style={{ padding: '15px 5px' }}>
            {intl.formatMessage({ id: 'beTheFirstToComment', defaultMessage: 'Be the first to comment' })}
          </div>
        )}
      </div>
    );
  }
}

export default injectIntl(ListComments);
