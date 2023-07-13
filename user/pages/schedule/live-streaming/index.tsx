import PageHeading from '@components/common/page-heading';
import { IPerformer } from '@interfaces/performer';
import { getResponseError } from '@lib/utils';
import { performerService } from '@services/performer.service';
import { streamRequestService } from '@services/stream-request.service';
import {
  Button, DatePicker, Form, Layout, message, Select
} from 'antd';
import moment from 'moment';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { IntlShape, useIntl } from 'react-intl';
import timezones from 'timezones-list';

function LiveStreamingSchedule() {
  const { query } = useRouter();
  const [performer, setPerformer] = useState<IPerformer>();
  const intl: IntlShape = useIntl();

  useEffect(() => {
    const initProfile = async () => {
      const resp = await Promise.resolve(
        performerService.findOne(query.performerId as string)
      );
      resp && setPerformer(resp.data);
    };

    initProfile();
  }, [query]);

  const submit = async (values: any) => {
    try {
      await streamRequestService._request({
        timezone: values.timezone,
        performerId: performer._id,
        startAt: (values.startAt as moment.Moment).format('YYYY-MM-DD HH:mm a')
      });
      message.success(intl.formatMessage({ id: 'requestHasBeenSend', defaultMessage: 'Your request has been sent.' }));
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  if (!performer) return null;

  return (
    <Layout>
      <div className="main-container">
        <PageHeading title={intl.formatMessage({ id: 'liveStreamingSchedule', defaultMessage: 'Live Streaming Schedule' })} />
        <Form
          layout="vertical"
          onFinish={submit}
          wrapperCol={{
            md: {
              span: 12
            },
            xs: {
              span: 24
            }
          }}
        >
          <Form.Item
            name="timezone"
            label={intl.formatMessage({ id: 'timezone', defaultMessage: 'Timezone' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'timezoneIsRequired', defaultMessage: 'Timezone is required' })
              }
            ]}
          >
            <Select>
              <Select.Option value="">{intl.formatMessage({ id: 'pleaseSelect', defaultMessage: 'Please select' })}</Select.Option>
              {timezones.map((tz) => (
                <Select.Option value={tz.tzCode}>{tz.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startAt"
            label={intl.formatMessage({ id: 'date', defaultMessage: 'Date' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'dateIsRequired', defaultMessage: 'Date is required' })
              }
            ]}
          >
            <DatePicker
              disabledDate={(currentDate) => currentDate && currentDate.isBefore(new Date())}
              showTime={{ format: 'HH:mm a' }}
              format="YYYY-MM-DD HH:mm a"
            />
          </Form.Item>
          <Form.Item>
            <Button className="primary" htmlType="submit">
              {intl.formatMessage({ id: 'submit', defaultMessage: 'Submit' })}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Layout>
  );
}

LiveStreamingSchedule.authenticate = true;

export default LiveStreamingSchedule;
