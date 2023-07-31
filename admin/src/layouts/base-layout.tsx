import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IUser } from 'src/interfaces';
import { useRouter } from 'next/router';
import { ROLE_SUB_ADMIN } from 'src/constants';
import PublicLayout from './public-layout';
import PrimaryLayout from './primary-layout';

interface DefaultProps {
  children: any;
  // eslint-disable-next-line react/require-default-props
  layout?: string;
}

const LayoutMap = {
  primary: PrimaryLayout,
  public: PublicLayout
};

function BaseLayout({ children, layout }: DefaultProps) {
  const Container = layout && LayoutMap[layout] ? LayoutMap[layout] : LayoutMap.primary;
  const user = useSelector((state: any) => state.user.current) as IUser;
  const router = useRouter();

  useEffect(() => {
    if (user?._id && user.roles?.includes(ROLE_SUB_ADMIN) && !user.pathsAllow?.some((path) => router.pathname.includes(path))
      && !['/', '/account/settings'].includes(router.pathname)) {
      router.push('/');
    }
  }, [user, router.pathname]);

  return (
    <Container>{children}</Container>
  );
}

export default BaseLayout;
