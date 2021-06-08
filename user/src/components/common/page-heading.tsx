import Router from 'next/router';

interface Iprops {
  title: string;
  // eslint-disable-next-line react/require-default-props
  icon?: any
}

const PageHeading = ({ title, icon }: Iprops) => (
  <div className="page-heading">
    <span aria-hidden onClick={() => Router.back()}>
      {icon}
      {' '}
      {title}
    </span>
  </div>
);

export default PageHeading;
