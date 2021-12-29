import { PureComponent } from 'react';
import Link from 'next/link';
import { connect } from 'react-redux';
import { IUser, IUIConfig } from 'src/interfaces';
import { withRouter, NextRouter } from 'next/router';

interface IProps {
  currentUser: IUser;
  ui: IUIConfig;
  router: NextRouter;
  id?: string;
}
class Footer extends PureComponent<IProps> {
  render() {
    const {
      ui, currentUser, router, id
    } = this.props;
    const menus = ui.menus && ui.menus.length > 0
      ? ui.menus.filter((m) => m.section === 'footer')
      : [];
    return (
      <div className="main-footer" id={id || 'main-footer'}>
        <div className="main-container">
          <ul>
            {!currentUser._id ? (
              <>
                <li key="login" className={router.pathname === '/' ? 'active' : ''}>
                  <Link href="/">
                    <a>Log in</a>
                  </Link>
                </li>
                <li key="signup" className={router.pathname === '/auth/register' ? 'active' : ''}>
                  <Link href="/auth/register">
                    <a>Sign up</a>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li key="home" className={router.pathname === '/home' ? 'active' : ''}>
                  <Link href="/home">
                    <a>Home</a>
                  </Link>
                </li>
                <li key="model" className={router.pathname === '/model' ? 'active' : ''}>
                  <Link href="/model">
                    <a>Model</a>
                  </Link>
                </li>
                <li key="contact" className={router.pathname === '/contact' ? 'active' : ''}>
                  <Link href="/contact">
                    <a>Contact</a>
                  </Link>
                </li>
              </>
            )}
            {menus
              && menus.length > 0
              && menus.map((item) => (
                <li key={item._id} className={router.pathname === item.path ? 'active' : ''}>
                  <a rel="noreferrer" href={item.path} target={item.isNewTab ? '_blank' : ''}>
                    {item.title}
                  </a>
                </li>
              ))}
          </ul>
          {/* eslint-disable-next-line react/no-danger */}
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
export default withRouter(connect(mapState)(Footer));
