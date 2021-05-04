import { PureComponent } from 'react';
import {
  Input, Row, Col, Button, Select
} from 'antd';
import { omit } from 'lodash';
import { } from '@ant-design/icons';
import { ICountry } from '@interfaces/index';
import { utilsService } from '@services/index';

const genders = [
  { key: '', text: 'All genders' },
  { key: 'male', text: 'Male' },
  { key: 'female', text: 'Female' },
  { key: 'transgender', text: 'Trans' }
];

const eyeColors = [
  { key: '', text: 'All eye colors' },
  { key: 'blue', text: 'Blue' },
  { key: 'brown', text: 'Brown' },
  { key: 'green', text: 'Green' },
  { key: 'amber', text: 'Amber' },
  { key: 'gray', text: 'Gray' },
  { key: 'hazel', text: 'Hazel' },
  { key: 'red', text: 'Red' }
];

const hairColors = [
  { key: '', text: 'All hair colors' },
  { key: 'blond', text: 'Blond' },
  { key: 'black', text: 'Black' },
  { key: 'brown', text: 'Brown' },
  { key: 'red', text: 'Red' },
  { key: 'white', text: 'White' }
];

const buttSizes = [
  { key: '', text: 'All butt sizes' },
  { key: 'large', text: 'Large' },
  { key: 'medium', text: 'Medium' },
  { key: 'small', text: 'Small' }
];

const ethnicities = [
  { key: '', text: 'All ethnicities' },
  { key: 'americanIndianOrAlaskaNative', text: 'American Indian or Alaska Native' },
  { key: 'blackOrAfricanAmerican', text: 'Black or African American' },
  { key: 'hispanicOrLatino', text: 'Hispanic or Latino' },
  { key: 'nativeHawaiianOrOtherPacificIslander', text: 'Native Hawaiian or Other Pacific Islander' },
  { key: 'asian', text: 'Asian' },
  { key: 'white', text: 'White' }
];

const bodyTypes = [
  { key: '', text: 'All body types' },
  { key: 'slim', text: 'Slim' },
  { key: 'petite', text: 'Petite' },
  { key: 'curvy', text: 'Curvy' },
  { key: 'large', text: 'Large' },
  { key: 'toned', text: 'Toned' },
  { key: 'fit', text: 'Fit' },
  { key: 'muscular', text: 'Muscular' },
  { key: 'ripped', text: 'Ripped' },
  { key: 'tanned', text: 'Tanned' }
];

const ages = [
  { key: '', text: 'All ages' },
  { key: '14_16', text: '14 to 16' },
  { key: '17_19', text: '17 to 19' },
  { key: '20_22', text: '20 to 22' },
  { key: '23_25', text: '23 to 25' },
  { key: '26_28', text: '26 to 28' },
  { key: '29_31', text: '29 to 31' },
  { key: '32_34', text: '32 to 34' },
  { key: '35_37', text: '35 to 37' },
  { key: '38_40', text: '38 to 40' },
  { key: 'over_40', text: 'Over 40' }
];

interface IProps {
  onSubmit?: Function;
  countries?: ICountry[]
}

export class PerformerAdvancedFilter extends PureComponent<IProps> {
  state = {
    q: '',
    showMore: false,
    heights: [],
    weights: []
  };

  componentDidMount() {
    this.getHeights();
  }

  handleSubmit() {
    const { onSubmit } = this.props;
    onSubmit(omit(this.state, ['showMore', 'heights', 'weights']));
  }

  async getHeights() {
    try {
      const resp = await (await utilsService.heightList()).data;
      resp && this.setState({ heights: resp });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }

  async getWeights() {
    try {
      const resp = await (await utilsService.weightList()).data;
      resp && this.setState({ weights: resp });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }

  render() {
    const { countries } = this.props;
    const { showMore, heights, weights } = this.state;
    return (
      <Row gutter={24} className="filter-block">
        <Col md={{ span: 20 }} xs={{ span: 24 }} style={{ padding: 0 }}>
          <Row>
            <Col md={{ span: 12 }} xs={{ span: 24 }}>
              <Input
                placeholder="Enter keyword"
                onChange={(evt) => this.setState({ q: evt.target.value })}
                onPressEnter={this.handleSubmit.bind(this)}
              />
            </Col>
            {genders && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ gender: val })}
                  style={{ width: '100%' }}
                  placeholder="Orientation"
                  defaultValue=""
                >
                  {genders.map((gen) => (
                    <Select.Option key={gen.key} value={gen.key}>
                      {gen.text || gen.key}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
            )}
            <Row style={{ width: '100%', display: !showMore ? 'none' : 'flex' }}>
              {countries && countries.length > 0 && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ country: val })}
                  style={{ width: '100%' }}
                  placeholder="Countries"
                  defaultValue=""
                  showSearch
                  optionFilterProp="label"
                >
                  <Select.Option key="All" label="" value="">
                    All countries
                  </Select.Option>
                  {countries.map((c) => (
                    <Select.Option key={c.code} label={c.name} value={c.code}>
                      <img alt="flag" src={c.flag} width="25px" />
                      &nbsp;
                      {c.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              )}
              {ages.length > 0 && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ age: val })}
                  style={{ width: '100%' }}
                  placeholder="Ages"
                  defaultValue=""
                >
                  {ages.map((i) => (
                    <Select.Option key={i.key} value={i.key}>
                      {i.text || i.key}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              )}
              {eyeColors.length > 0 && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ eyes: val })}
                  style={{ width: '100%' }}
                  placeholder="Eyes color"
                  defaultValue=""
                >
                  {eyeColors.map((i) => (
                    <Select.Option key={i.key} value={i.key}>
                      {i.text || i.key}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              )}
              {hairColors.length > 0 && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ hair: val })}
                  style={{ width: '100%' }}
                  placeholder="Hair color"
                  defaultValue=""
                >
                  {hairColors.map((i) => (
                    <Select.Option key={i.key} value={i.key}>
                      {i.text || i.key}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              )}
              {buttSizes.length > 0 && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ bust: val })}
                  style={{ width: '100%' }}
                  placeholder="Select butt size"
                  defaultValue=""
                >
                  {buttSizes.map((i) => (
                    <Select.Option key={i.key} value={i.key}>
                      {i.text || i.key}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              )}
              {heights.length > 0 && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ height: val })}
                  style={{ width: '100%' }}
                  placeholder="Select height"
                  defaultValue=""
                >
                  <Select.Option key="all" value="">
                    All heights
                  </Select.Option>
                  {heights.map((i) => (
                    <Select.Option key={i.text} value={i.text}>
                      {i.text}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              )}
              {weights.length > 0 && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ weight: val })}
                  style={{ width: '100%' }}
                  placeholder="Select weight"
                  defaultValue=""
                >
                  <Select.Option key="all" value="">
                    All weights
                  </Select.Option>
                  {weights.map((i) => (
                    <Select.Option key={i.text} value={i.text}>
                      {i.text}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              )}
              {ethnicities.length > 0 && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ ethnicity: val })}
                  style={{ width: '100%' }}
                  placeholder="Select ethnicity"
                  defaultValue=""
                >
                  {ethnicities.map((i) => (
                    <Select.Option key={i.key} value={i.key}>
                      {i.text || i.key}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              )}
              {bodyTypes.length > 0 && (
              <Col md={{ span: 12 }} xs={{ span: 24 }}>
                <Select
                  onChange={(val) => this.setState({ bodyType: val })}
                  style={{ width: '100%' }}
                  placeholder="Select body type"
                  defaultValue=""
                >
                  {bodyTypes.map((i) => (
                    <Select.Option key={i.key} value={i.key}>
                      {i.text || i.key}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              )}

            </Row>
          </Row>
        </Col>
        <Col md={{ span: 4 }} xs={{ span: 24 }} style={{ padding: 0 }}>
          <Button
            type="primary"
            className="primary"
            style={{ width: '100%' }}
            onClick={this.handleSubmit.bind(this)}
          >
            Search
          </Button>
          {/* <span className={showMore ? 'btn-show-more active' : 'btn-show-more'}>
            <a aria-hidden onClick={() => this.setState({ showMore: !showMore })}>
              Advanced search
              {' '}
              {showMore ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            </a>
          </span> */}
        </Col>
      </Row>
    );
  }
}
