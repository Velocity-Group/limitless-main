import { Descriptions, Collapse } from 'antd';
import { PureComponent } from 'react';
import { ICountry, IPerformer } from 'src/interfaces';
import { formatDateNoTime } from '@lib/date';

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
}

export class PerformerInfo extends PureComponent<IProps> {
  render() {
    const { performer, countries = [] } = this.props;
    const country = countries.length && countries.find((c) => c.code === performer?.country);
    return (
      <div className="per-infor">
        <Collapse className="bio" defaultActiveKey={['1']} bordered={false} accordion>
          <Collapse.Panel header="BIO" key="1">
            <p>{performer?.bio || 'No bio yet'}</p>
            <Descriptions className="performer-info">
              {performer?.country && (
                <Descriptions.Item key="country" label={null}>
                  <img alt="performer-country" src={country?.flag} height="20px" />
                  &nbsp;
                  {country?.name}
                </Descriptions.Item>
              )}
              {performer?.gender && (
                <Descriptions.Item label="Gender">
                  {performer?.gender}
                </Descriptions.Item>
              )}
              {performer?.dateOfBirth && <Descriptions.Item label="Date of Birth">{formatDateNoTime(performer?.dateOfBirth)}</Descriptions.Item>}
              {performer?.bodyType && <Descriptions.Item label="Body Type">{performer?.bodyType}</Descriptions.Item>}
              {performer?.state && <Descriptions.Item label="State/County/Province">{performer?.state}</Descriptions.Item>}
              {performer?.city && <Descriptions.Item label="City">{performer?.city}</Descriptions.Item>}
              {performer?.height && <Descriptions.Item label="Height">{performer?.height}</Descriptions.Item>}
              {performer?.weight && <Descriptions.Item label="Weight">{performer?.weight}</Descriptions.Item>}
              {performer?.eyes && <Descriptions.Item label="Eyes color">{performer?.eyes}</Descriptions.Item>}
              {performer?.ethnicity && <Descriptions.Item label="Ethnicity">{performer?.ethnicity}</Descriptions.Item>}
              {performer?.hair && <Descriptions.Item label="Hair color">{performer?.hair}</Descriptions.Item>}
              {performer?.pubicHair && <Descriptions.Item label="Pubic Hair">{performer?.pubicHair}</Descriptions.Item>}
              {performer?.bust && <Descriptions.Item label="Bust size">{performer?.bust}</Descriptions.Item>}
              {performer?.sexualOrientation && <Descriptions.Item label="Sexual reference">{performer?.sexualOrientation}</Descriptions.Item>}
            </Descriptions>
          </Collapse.Panel>
        </Collapse>
      </div>
    );
  }
}
