import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Tabs, message } from 'antd';
import Page from '@components/common/layout/page';
import { IUser } from 'src/interfaces';
import { authService, userService } from '@services/index';
import { UpdatePaswordForm } from '@components/user/update-password-form';
import Loader from '@components/common/base/loader';
import { SubAdminForm } from '@components/user/sub-admin-form';

interface IProps {
  id: string;
}
function SubAdminUpdate({ id }: IProps) {
  const [pwUpdating, setPwUpdating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [subAdmin, setSubAdmin] = useState({} as IUser);

  const findSubAdmin = async () => {
    try {
      setFetching(true);
      const resp = await userService.findById(id);
      setSubAdmin(resp.data);
    } catch (e) {
      message.error('Error while fetching user!');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    findSubAdmin();
  }, []);

  const onAvatarUploaded = () => {
    // TODO - check with current user if needed?
    message.success('Avatar has been updated!');
    // this.props.updateCurrentUserAvatar(data.base64);
  };

  const submit = async (data: any) => {
    try {
      setUpdating(true);
      const updated = await userService.update(id, data);
      setSubAdmin(updated.data);
      message.success('Updated successfully');
    } catch (e) {
      // TODO - exact error message
      const error = await e;
      message.error(error && (error.message || 'An error occurred, please try again!'));
    } finally {
      setUpdating(false);
    }
  };

  const updatePassword = async (data: any) => {
    try {
      setPwUpdating(true);
      await authService.updatePassword(data.password, id, 'user');
      message.success('Password has been updated!');
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      setPwUpdating(false);
    }
  };

  const uploadHeaders = {
    authorization: authService.getToken()
  };
  return (
    <>
      <Head>
        <title>Sub admin update</title>
      </Head>
      <Page>
        {fetching ? (
          <Loader />
        ) : (
          <Tabs defaultActiveKey="basic" tabPosition="top">
            <Tabs.TabPane tab={<span>Basic information</span>} key="basic">
              <SubAdminForm
                onFinish={submit}
                user={subAdmin}
                updating={updating}
                options={{
                  uploadHeaders,
                  avatarUploadUrl: userService.getAvatarUploadUrl(subAdmin._id),
                  onAvatarUploaded,
                  avatarUrl: subAdmin?.avatar
                }}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Change password</span>} key="password">
              <UpdatePaswordForm onFinish={updatePassword} updating={pwUpdating} />
            </Tabs.TabPane>
          </Tabs>
        )}
      </Page>
    </>
  );
}

SubAdminUpdate.getInitialProps = async ({ ctx }) => {
  const { query } = ctx;
  return {
    id: query.id
  };
};

export default SubAdminUpdate;
