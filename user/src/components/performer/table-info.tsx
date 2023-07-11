import { Descriptions, Collapse } from 'antd';
import { PureComponent } from 'react';
import { ICountry, IPerformer } from 'src/interfaces';
import { formatDate } from '@lib/date';
import { HEIGHTS, WEIGHTS } from 'src/constants';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
  intl: IntlShape
}

class PerformerInfo extends PureComponent<IProps> {
  detectURLs(str: string) {
    const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return str.match(urlRegex);
  }

  replaceURLs(str: string) {
    const { intl } = this.props;
    if (!str) return intl.formatMessage({ id: 'noBioYet', defaultMessage: 'No bio yet' });

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
    const { performer, countries = [], intl } = this.props;
    const country = countries.length && countries.find((c) => c.code === performer?.country);
    const height = HEIGHTS.find((f) => f.value === performer?.height);
    const weight = WEIGHTS.find((f) => f.value === performer?.weight);
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
            ) : intl.formatMessage({ id: 'biographyUpCase', defaultMessage: 'BIOGRAPHY' })}
            key="1"
          >
            <p
              className="bio"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: this.replaceURLs(performer?.bio) }}
            />
            <Descriptions className="performer-info">
              {performer?.gender && (
                <Descriptions.Item label={intl.formatMessage({ id: 'gender', defaultMessage: 'Gender' })}>
                  {intl.formatMessage({ id: performer?.gender, defaultMessage: performer?.gender })}
                </Descriptions.Item>
              )}
              {performer?.sexualOrientation && <Descriptions.Item label={intl.formatMessage({ id: 'sexualOrientation', defaultMessage: 'Sexual orientation' })}>{intl.formatMessage({ id: performer?.sexualOrientation, defaultMessage: performer?.sexualOrientation })}</Descriptions.Item>}
              {performer?.dateOfBirth && <Descriptions.Item label={intl.formatMessage({ id: 'dateOfBirth', defaultMessage: 'Date of Birth' })}>{formatDate(performer?.dateOfBirth, 'DD/MM/YYYY')}</Descriptions.Item>}
              {performer?.bodyType && <Descriptions.Item label={intl.formatMessage({ id: 'bodyType', defaultMessage: 'Body type' })}>{intl.formatMessage({ id: performer?.bodyType, defaultMessage: performer?.bodyType })}</Descriptions.Item>}
              {performer?.state && <Descriptions.Item label={intl.formatMessage({ id: 'state', defaultMessage: 'State' })}>{intl.formatMessage({ id: performer?.state, defaultMessage: performer?.state })}</Descriptions.Item>}
              {performer?.city && <Descriptions.Item label={intl.formatMessage({ id: 'city', defaultMessage: 'City' })}>{intl.formatMessage({ id: performer?.city, defaultMessage: performer?.city })}</Descriptions.Item>}
              {performer?.height && <Descriptions.Item label={intl.formatMessage({ id: 'height', defaultMessage: 'Height' })}>{intl.formatMessage({ id: height.value, defaultMessage: height.text })}</Descriptions.Item>}
              {performer?.weight && <Descriptions.Item label={intl.formatMessage({ id: 'weight', defaultMessage: 'Weight' })}>{intl.formatMessage({ id: weight.value, defaultMessage: weight.text })}</Descriptions.Item>}
              {performer?.eyes && <Descriptions.Item label={intl.formatMessage({ id: 'eyeColor', defaultMessage: 'Eye color' })}>{intl.formatMessage({ id: performer?.eyes, defaultMessage: performer?.eyes })}</Descriptions.Item>}
              {performer?.ethnicity && <Descriptions.Item label={intl.formatMessage({ id: 'ethnicity', defaultMessage: 'Ethnicity' })}>{intl.formatMessage({ id: performer?.ethnicity, defaultMessage: performer?.ethnicity })}</Descriptions.Item>}
              {performer?.hair && <Descriptions.Item label={intl.formatMessage({ id: 'hairColor', defaultMessage: 'Hair color' })}>{intl.formatMessage({ id: performer?.hair, defaultMessage: performer?.hair })}</Descriptions.Item>}
              {performer?.butt && <Descriptions.Item label={intl.formatMessage({ id: 'buttSize', defaultMessage: 'Butt size' })}>{intl.formatMessage({ id: performer?.butt, defaultMessage: performer?.butt })}</Descriptions.Item>}
            </Descriptions>
          </Collapse.Panel>
        </Collapse>
      </div>
    );
  }
}

export default injectIntl(PerformerInfo);
