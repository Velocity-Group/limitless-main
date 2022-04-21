import { Descriptions, Collapse } from 'antd';
import { PureComponent } from 'react';
import { ICountry, IPerformer } from 'src/interfaces';
import { formatDate } from '@lib/date';

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
}

export class PerformerInfo extends PureComponent<IProps> {
  detectURLs(str: string) {
    const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return str.match(urlRegex);
  }

  replaceURLs(str: string) {
    if (!str) return 'No bio yet';

    const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    const result = str.replace(urlRegex, (url: string) => {
      let hyperlink = url;
      if (!hyperlink.match('^https?:\\/\\/')) {
        hyperlink = `http://${hyperlink}`;
      }
      return `<a href="${hyperlink}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    // eslint-disable-next-line consistent-return
    return result;
  }

  render() {
    const { performer, countries = [] } = this.props;
    const country = countries.length && countries.find((c) => c.code === performer?.country);
    return (
      <div className="per-infor">
        <Collapse defaultActiveKey={['1']} bordered={false} accordion>
          <Collapse.Panel
            header={performer?.country ? (
              <>
                <img alt="flag" src={country?.flag} width="25px" />
                &nbsp;
                {country?.name}
              </>
            ) : 'BIOGRAPHY'}
            key="1"
          >
            <p
              className="bio"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: this.replaceURLs(performer?.bio) }}
            />
            <Descriptions className="performer-info">
              {performer?.gender && (
                <Descriptions.Item label="Gender">
                  {performer?.gender}
                </Descriptions.Item>
              )}
              {performer?.sexualOrientation && <Descriptions.Item label="Sexual orientation">{performer?.sexualOrientation}</Descriptions.Item>}
              {performer?.dateOfBirth && <Descriptions.Item label="Date of Birth">{formatDate(performer?.dateOfBirth, 'DD/MM/YYYY')}</Descriptions.Item>}
              {performer?.bodyType && <Descriptions.Item label="Body Type">{performer?.bodyType}</Descriptions.Item>}
              {performer?.state && <Descriptions.Item label="State">{performer?.state}</Descriptions.Item>}
              {performer?.city && <Descriptions.Item label="City">{performer?.city}</Descriptions.Item>}
              {performer?.height && <Descriptions.Item label="Height">{performer?.height}</Descriptions.Item>}
              {performer?.weight && <Descriptions.Item label="Weight">{performer?.weight}</Descriptions.Item>}
              {performer?.eyes && <Descriptions.Item label="Eye color">{performer?.eyes}</Descriptions.Item>}
              {performer?.ethnicity && <Descriptions.Item label="Ethnicity">{performer?.ethnicity}</Descriptions.Item>}
              {performer?.hair && <Descriptions.Item label="Hair color">{performer?.hair}</Descriptions.Item>}
              {performer?.butt && <Descriptions.Item label="Butt size">{performer?.butt}</Descriptions.Item>}
            </Descriptions>
          </Collapse.Panel>
        </Collapse>
      </div>
    );
  }
}
