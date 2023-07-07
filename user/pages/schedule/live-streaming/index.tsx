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
import timezones from 'timezones-list';

function LiveStreamingSchedule() {
  const { query } = useRouter();
  const [performer, setPerformer] = useState<IPerformer>();

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
      message.success('Request has been sent');
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  if (!performer) return null;

  return (
    <Layout>
      <div className="main-container">
        <PageHeading title="Live Streaming Schedule" />
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
            label="Timezone"
            rules={[
              {
                required: true,
                message: 'Timezone is required'
              }
            ]}
          >
            <Select>
              <Select.Option value="">Please select</Select.Option>
              {timezones.map((tz) => (
                <Select.Option value={tz.tzCode}>{tz.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startAt"
            label="Date"
            rules={[
              {
                required: true,
                message: 'Date is required'
              }
            ]}
          >
            <DatePicker
              disabledDate={(currentDate) => currentDate && currentDate < moment().endOf('day')}
              showTime={{ format: 'HH:mm a' }}
              format="YYYY-MM-DD HH:mm a"
            />
          </Form.Item>
          <Form.Item>
            <Button className="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Layout>
  );
}

LiveStreamingSchedule.authenticate = true;

export default LiveStreamingSchedule;
