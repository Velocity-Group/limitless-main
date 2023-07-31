import Head from 'next/head';
import { useState } from 'react';
import { message } from 'antd';
import Page from '@components/common/layout/page';
import Router from 'next/router';
import { userService } from '@services/index';
import { validateUsername, getResponseError } from '@lib/utils';
import { SubAdminForm } from '@components/user/sub-admin-form';

function SubAminCreate() {
  const [creating, setCreating] = useState(false);

  let _avatar: File;

  const onBeforeUpload = async (file) => {
    _avatar = file;
  };

  const submit = async (data: any) => {
    try {
      if (data.password !== data.rePassword) {
        message.error('Confirm password is mismatched!');
        return;
      }

      if (!validateUsername(data.username)) {
        message.error('Username must contain lowercase alphanumerics only');
        return;
      }
      setCreating(true);
      const resp = await userService.createSubAdmin(data);
      message.success('Created successfully');
      if (_avatar) {
        await userService.uploadAvatarUser(_avatar, resp.data._id);
      }
      Router.push({ pathname: '/sub-admins' }, '/sub-admins');
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(getResponseError(err) || 'An error occurred, please try again!');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Sub Admin</title>
      </Head>
      <Page>
        <SubAdminForm
          onFinish={submit}
          updating={creating}
          options={{
            beforeUpload: onBeforeUpload
          }}
        />
      </Page>
    </>
  );
}

export default SubAminCreate;
