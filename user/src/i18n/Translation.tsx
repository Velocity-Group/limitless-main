import { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

interface defaultProps {
  id: string;
  defaultMessage: string;
  values?: Record<string, any>;
  description?: string;
  prefix?: string;
  suffix?: string;
  colon?: boolean;
  children?(...nodes: ReactNode[]): any;
}
const Translation = ({
  id,
  defaultMessage,
  prefix,
  suffix,
  values,
  description,
  colon,
  children
}: defaultProps) => (
  <FormattedMessage
    id={id}
    defaultMessage={defaultMessage}
    values={values}
    description={description}
  >
    {children
      || ((formattedMessage) => (
        <>
          {`${prefix}${formattedMessage}${suffix || (colon ? ': ' : '')
          }`}
        </>
      ))}
  </FormattedMessage>
);
Translation.defaultProps = {
  description: '',
  colon: false,
  prefix: '',
  suffix: '',
  values: {},
  children: null
};
Translation.displayName = 'Translation';
export default Translation;
