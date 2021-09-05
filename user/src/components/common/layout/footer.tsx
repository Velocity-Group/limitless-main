/* eslint-disable react/no-danger */
import { PureComponent } from 'react';
import Link from 'next/link';
import { connect } from 'react-redux';
import { IUser, IUIConfig } from 'src/interfaces';
import { withRouter } from 'next/router';

interface IProps {
  currentUser: IUser;
  ui: IUIConfig;
  router: any;
}
class Footer extends PureComponent<IProps> {
  render() {
    const linkAuth = [
      <li key="login">
        <Link href="/">
          <a>Login</a>
        </Link>
      </li>,
      <li key="signup">
        <Link href="/auth/register">
          <a>Sign up</a>
        </Link>
      </li>];
    const { ui, currentUser, router } = this.props;
    const menus = ui.menus && ui.menus.length > 0
      ? ui.menus.filter((m) => m.section === 'footer')
      : [];
    return (

      <div className="main-footer">
        <div className="main-container">
          <ul>
            <li>
              <Link href="/home">
                <a>Home</a>
              </Link>
            </li>
            <li>
              <Link href="/model">
                <a>Models</a>
              </Link>
            </li>
            <li>
              <Link href="/contact">
                <a>Contact</a>
              </Link>
            </li>
            {!currentUser._id ? linkAuth : null}
          </ul>
          { menus && menus.length > 0 && (
          <ul>
            {menus
              && menus.length > 0
              && menus.map((item) => (
                <li key={item._id} className={router.pathname === item.path ? 'active' : ''}>
                  {!item.internal ? (
                    <a rel="noreferrer" href={item.path} target={item.isNewTab ? '_blank' : ''}>
                      {item.title}
                    </a>
                  ) : (
                    <Link
                      href={item.path}
                    >
                      <a target={item.isNewTab ? '_blank' : ''}>{item.title}</a>
                    </Link>
                  )}
                </li>
              ))}
          </ul>
          )}
          {ui.footerContent ? <div className="footer-content" dangerouslySetInnerHTML={{ __html: ui.footerContent }} />
            : (
              <div className="copyright-text">
                <span>
                  <Link href="/home">
                    <a>{ui?.siteName}</a>
                  </Link>
                  {' '}
                  © Copyright
                  {' '}
                  {new Date().getFullYear()}
                </span>
              </div>
            )}
        </div>
      </div>
    );
  }
}
const mapState = (state: any) => ({
  currentUser: state.user.current,
  ui: { ...state.ui }
});
export default withRouter(connect(mapState)(Footer)) as any;
