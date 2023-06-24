import { PureComponent } from 'react';
import { blockService } from '@services/index';
import dynamic from 'next/dynamic';

const BlankLayout = dynamic(() => import('./blank-layout'));
const PrimaryLayout = dynamic(() => import('./primary-layout'));
const MaintenaceLayout = dynamic(() => import('./maintenance-layout'));
const GEOLayout = dynamic(() => import('./geoBlocked-layout'));
const PublicLayout = dynamic(() => import('./public-layout'));

interface DefaultProps {
  children: any;
  layout: string;
  maintenance: boolean;
}

const LayoutMap = {
  geoBlock: GEOLayout,
  maintenance: MaintenaceLayout,
  primary: PrimaryLayout,
  public: PublicLayout,
  blank: BlankLayout
};

export default class BaseLayout extends PureComponent<DefaultProps> {
  state = {
    geoBlocked: false
  }

  componentDidMount() {
    process.env.NODE_ENV === 'production' && document.addEventListener('contextmenu', (event) => event.preventDefault());
    this.clientCheckBlockByIp();
  }

  componentWillUnmount() {
    process.env.NODE_ENV === 'production' && document.removeEventListener('contextmenu', (event) => event.preventDefault());
  }

  async clientCheckBlockByIp() {
    const checkBlock = await blockService.checkCountryBlock();
    if (checkBlock?.data?.blocked) {
      this.setState({ geoBlocked: true });
    }
  }

  render() {
    const {
      children, layout, maintenance = false
    } = this.props;
    const { geoBlocked } = this.state;
    // eslint-disable-next-line no-nested-ternary
    const Container = maintenance ? LayoutMap.maintenance : geoBlocked ? LayoutMap.geoBlock : layout && LayoutMap[layout] ? LayoutMap[layout] : LayoutMap.primary;
    return (
      <Container>{children}</Container>
    );
  }
}
