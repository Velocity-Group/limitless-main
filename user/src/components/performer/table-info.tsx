import { Descriptions, Tag } from 'antd';
import { PureComponent } from 'react';
import { ICountry, IPerformer } from 'src/interfaces';
import './performer.less';
import { formatDateNoTime } from '@lib/date';

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
}

export class PerformerInfo extends PureComponent<IProps> {
  render() {
    const { performer, countries = [] } = this.props;
    const country = countries.length && countries.find((c) => c.code === performer.country);
    return (
      <>
        <Descriptions className="performer-info">
          {performer?.country && (
          <Descriptions.Item key="country" label="Country">
            <img alt="performer-country" src={country?.flag} height="20px" />
              &nbsp;
            {country?.name}
          </Descriptions.Item>
          )}
          {performer.gender && (
          <Descriptions.Item label="Gender">
            <Tag color="magenta">
              <img
                height="15px"
                alt="performer-gender"
                // eslint-disable-next-line no-nested-ternary
                src={performer.gender === 'male' ? '/static/male.png' : performer.gender === 'female' ? '/static/female.png' : performer.gender === 'couple' ? '/static/couple.png' : '/static/transgender.png'}
              />
              {' '}
              {performer.gender}
            </Tag>
          </Descriptions.Item>
          )}
          {performer.dateOfBirth && <Descriptions.Item label="Date of Birth">{formatDateNoTime(performer.dateOfBirth)}</Descriptions.Item>}
          {performer.bodyType && <Descriptions.Item label="Body Type">{performer.bodyType}</Descriptions.Item>}
          {performer.state && <Descriptions.Item label="State/County/Province">{performer.state}</Descriptions.Item>}
          {performer.city && <Descriptions.Item label="City">{performer.city}</Descriptions.Item>}
          {performer.height && <Descriptions.Item label="Height">{performer.height}</Descriptions.Item>}
          {performer.weight && <Descriptions.Item label="Weight">{performer.weight}</Descriptions.Item>}
          {performer.eyes && <Descriptions.Item label="Eyes color">{performer.eyes}</Descriptions.Item>}
          {performer.ethnicity && <Descriptions.Item label="Ethnicity">{performer.ethnicity}</Descriptions.Item>}
          {performer.hair && <Descriptions.Item label="Hair color">{performer.hair}</Descriptions.Item>}
          {performer.pubicHair && <Descriptions.Item label="Pubic Hair">{performer.pubicHair}</Descriptions.Item>}
          {performer.bust && <Descriptions.Item label="Bust size">{performer.bust}</Descriptions.Item>}
          {performer.sexualPreference && <Descriptions.Item label="Sexual reference">{performer.sexualPreference}</Descriptions.Item>}
        </Descriptions>
      </>
    );
  }
}
