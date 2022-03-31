import { PureComponent } from 'react';
import {
  Input, Button, Select
} from 'antd';
import { omit } from 'lodash';
import { ArrowUpOutlined, ArrowDownOutlined, FilterOutlined } from '@ant-design/icons';
import { ICountry, IBody } from '@interfaces/index';

interface IProps {
  onSubmit: Function;
  countries: ICountry[];
  bodyInfo: IBody;
}

export class PerformerAdvancedFilter extends PureComponent<IProps> {
  state = {
    showMore: false
  };

  handleSubmit() {
    const { onSubmit } = this.props;
    onSubmit(omit(this.state, ['showMore']));
  }

  render() {
    const { countries, bodyInfo } = this.props;
    const { showMore } = this.state;
    const {
      heights = [], weights = [], bodyTypes = [], genders = [], sexualOrientations = [], ethnicities = [],
      hairs = [], eyes = [], butts = [], ages = []
    } = bodyInfo;

    return (
      <div style={{ width: '100%' }}>
        <div className="filter-block custom">
          <div className="filter-item custom">
            <Input
              placeholder="Enter keyword"
              onChange={(evt) => this.setState({ q: evt.target.value })}
              onPressEnter={this.handleSubmit.bind(this)}
            />
          </div>
          <div className="filter-item">
            <Select style={{ width: '100%' }} defaultValue="live" onChange={(val) => this.setState({ sortBy: val }, () => this.handleSubmit())}>
              <Select.Option value="" disabled>
                <FilterOutlined />
                {' '}
                Sort By
              </Select.Option>
              <Select.Option value="popular">
                Popular
              </Select.Option>
              <Select.Option label="" value="latest">
                Latest
              </Select.Option>
              <Select.Option value="oldest">
                Oldest
              </Select.Option>
              <Select.Option value="online">
                Online
              </Select.Option>
              <Select.Option value="live">
                Live
              </Select.Option>
            </Select>
          </div>
          <div className="filter-item">
            <Button
              className="primary"
              style={{ width: '100%' }}
              onClick={() => this.setState({ showMore: !showMore })}
            >
              Advanced search
              {' '}
              {showMore ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            </Button>
          </div>
        </div>
        <div className={!showMore ? 'filter-block hide' : 'filter-block custom'}>
          <div className="filter-item">
            <Select
              // eslint-disable-next-line no-nested-ternary
              onChange={(val: any) => this.setState({ isFreeSubscription: val === 'false' ? false : val === 'true' ? true : '' }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All subscriptions
              </Select.Option>
              <Select.Option key="false" value="false">
                Non-free subscription
              </Select.Option>
              <Select.Option key="true" value="true">
                Free subscription
              </Select.Option>
            </Select>
          </div>
          {countries && countries.length > 0 && (
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ country: val }, () => this.handleSubmit())}
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
          </div>
          )}
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ gender: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All genders
              </Select.Option>
              {genders.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ sexualOrientation: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All sexual orientations
              </Select.Option>
              {sexualOrientations.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ age: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder="Age"
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All ages
              </Select.Option>
              {ages.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ eyes: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder="Eye color"
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All eye colors
              </Select.Option>
              {eyes.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ hair: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder="Hair color"
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All hair colors
              </Select.Option>
              {hairs.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ butt: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder="Butt size"
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All butt size
              </Select.Option>
              {butts.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ height: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder="Height"
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All heights
              </Select.Option>
              {heights.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ weight: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder="Weight"
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
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ ethnicity: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder="Ethnicity"
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All ethnicities
              </Select.Option>
              {ethnicities.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ bodyType: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder="Body type"
              defaultValue=""
            >
              <Select.Option key="all" value="">
                All body types
              </Select.Option>
              {bodyTypes.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.text}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ streamingStatus: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              defaultValue=""
            >
              <Select.Option key="streaming-all" value="">
                All streaming status
              </Select.Option>
              <Select.Option key="streaming-live" value="public">
                Live
              </Select.Option>
            </Select>
          </div>
        </div>
      </div>
    );
  }
}
