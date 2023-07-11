/* eslint-disable react/no-danger */
import { PureComponent } from 'react';
import { Row, Col } from 'antd';
import Link from 'next/link';
import Head from 'next/head';
import { IUIConfig } from 'src/interfaces';
import { connect } from 'react-redux';
import { authService, userService } from '@services/index';
import { loginSuccess } from '@redux/auth/actions';
import { updateCurrentUser } from '@redux/user/actions';
import Router from 'next/router';
import './index.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  loginSuccess: Function;
  updateCurrentUser: Function;
  intl: IntlShape;
}
class Dashboard extends PureComponent<IProps> {
  static layout = 'blank';

  static authenticate = false;

  state = {
    loginAs: 'user'
  };

  async componentDidMount() {
    const {
      loginSuccess: loginSuccessHandler,
      updateCurrentUser: updateCurrentUserHandler
    } = this.props;
    const token = authService.getToken();
    if (!token || token === 'null') {
      return;
    }
    authService.setToken(token);
    const user = await userService.me({
      Authorization: token
    });

    // TODO - check permission
    if (!user.data._id) {
      return;
    }
    loginSuccessHandler();
    updateCurrentUserHandler(user.data);
    Router.push('/home');
  }

  handleSwitch(value) {
    this.setState({ loginAs: value });
  }

  render() {
    const { ui, intl } = this.props;
    const { loginAs } = this.state;
    return (
      <div className="container">
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({ id: 'register', defaultMessage: 'Register' })}
          </title>
        </Head>
        <div className="main-container">
          <div className="login-box">
            <Row>
              <Col xs={24} sm={24} md={8} lg={12}>
                <div
                  className="login-content left fixed"
                  style={
                    ui.loginPlaceholderImage
                      ? { backgroundImage: `url(${ui.loginPlaceholderImage})` }
                      : null
                  }
                />
              </Col>
              <Col xs={24} sm={24} md={16} lg={12}>
                <div className="login-content right custom">
                  <div className="switch-btn">
                    <button
                      type="button"
                      className={loginAs === 'user' ? 'active' : ''}
                      onClick={this.handleSwitch.bind(this, 'user')}
                      style={{ marginRight: '20px' }}
                    >
                      {intl.formatMessage({
                        id: 'fanSignUp',
                        defaultMessage: 'Fan Sign Up'
                      })}
                    </button>
                    <button
                      type="button"
                      className={loginAs === 'performer' ? 'active' : ''}
                      onClick={this.handleSwitch.bind(this, 'performer')}
                    >
                      {intl.formatMessage({
                        id: 'modelSignUp',
                        defaultMessage: 'Model Sign Up'
                      })}
                    </button>
                  </div>
                  <div className="welcome-box">
                    <h3>
                      {loginAs === 'user'
                        ? `${intl.formatMessage({
                          id: 'fan',
                          defaultMessage: 'Fan'
                        })}`
                        : `${intl.formatMessage({
                          id: 'model',
                          defaultMessage: 'Model'
                        })}`}
                      {' '}
                      {intl.formatMessage({
                        id: 'benefits',
                        defaultMessage: 'Benefits'
                      })}
                    </h3>
                    {loginAs === 'performer' ? (
                      <div>
                        {ui && ui.modelBenefit ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: ui.modelBenefit
                            }}
                          />
                        ) : (
                          <ul>
                            <li>
                              {intl.formatMessage({
                                id: 'lightningFastUploading',
                                defaultMessage: 'Lightning fast uploading'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'multi-videoUploading',
                                defaultMessage: 'Multi-video uploading'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'chatWithFans',
                                defaultMessage: 'Chat with fans'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'contentBetweenModels',
                                defaultMessage:
                                  'Cross-over-content between models'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'individualModelStore',
                                defaultMessage: 'Individual model store'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'affiliateProgramFoBlogsToPromoteYourContent',
                                defaultMessage:
                                  'Affiliate program for blogs to promote your content'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'eightyPercentStandardCommissionRate',
                                defaultMessage: '80% Standard commission rate'
                              })}
                            </li>
                            <li>
                              (
                              {intl.formatMessage({
                                id: 'deductFivePercentWhenGainedFromAffiliates',
                                defaultMessage:
                                  'Deduct 5% when gained from affiliates'
                              })}
                              )
                            </li>
                          </ul>
                        )}
                        <Link href="/auth/model-register">
                          <a className="btn-primary ant-btn ant-btn-primary ant-btn-lg">
                            {intl.formatMessage({
                              id: 'modelSignUp',
                              defaultMessage: 'Model Sign Up'
                            })}
                          </a>
                        </Link>
                      </div>
                    ) : (
                      <div>
                        {ui && ui.userBenefit ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: ui.userBenefit }}
                          />
                        ) : (
                          <ul>
                            <li>
                              {intl.formatMessage({
                                id: 'viewExclusiveContent',
                                defaultMessage: 'View exclusive content'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'monthlyAndYearlySubscriptions',
                                defaultMessage:
                                  'Monthly and Yearly subscriptions'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'fastAndReliableBufferingAndViewing',
                                defaultMessage:
                                  'Fast and reliable buffering and viewing'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'multipleSolutionOptionsToChooseFrom',
                                defaultMessage:
                                  'Multiple solution options to choose from'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'chatWithModel',
                                defaultMessage: 'Chat with model'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'accessModelsPersonalStore',
                                defaultMessage: 'Access model\'s personal store'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'searchAndFilterCapabilities',
                                defaultMessage:
                                  'Search and filter capabilities'
                              })}
                            </li>
                            <li>
                              {intl.formatMessage({
                                id: 'favoriteYourVideoForFutureViewing',
                                defaultMessage:
                                  'Favorite your video for future viewing'
                              })}
                            </li>
                            <li />
                          </ul>
                        )}
                        <Link href="/auth/fan-register">
                          <a className="btn-primary ant-btn ant-btn-primary ant-btn-lg">
                            {intl.formatMessage({
                              id: 'fanSignUp',
                              defaultMessage: 'Fan Sign Up'
                            })}
                          </a>
                        </Link>
                      </div>
                    )}
                  </div>
                  <p className="text-center">
                    {intl.formatMessage({
                      id: 'haveAccountAlready',
                      defaultMessage: 'Have an account already?'
                    })}
                    <Link href="/auth/login">
                      <a>
                        {intl.formatMessage({
                          id: 'logInHere',
                          defaultMessage: 'Log in here.'
                        })}
                      </a>
                    </Link>
                  </p>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    );
  }
}

const mapStatesToProps = (state: any) => ({
  ui: { ...state.ui }
});

const mapDispatch = { loginSuccess, updateCurrentUser };

export default injectIntl(connect(mapStatesToProps, mapDispatch)(Dashboard));
