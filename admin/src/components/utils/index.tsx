import { useRouter } from 'next/router';

export function redirectHome(ctx: any) {
  if (process.browser) {
    const router = useRouter();
    router.push('/');
    return;
  }

  // fix for production build
  ctx.res.writeHead && ctx.res.writeHead(302, { Location: '/' });
  ctx.res.end && ctx.res.end();
}
