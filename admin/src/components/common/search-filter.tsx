import { PureComponent } from 'react';
import {
  Input, Row, Col, Select, DatePicker
} from 'antd';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { SelectGalleryDropdown } from '@components/gallery/common/select-gallery-dropdown';

const { RangePicker } = DatePicker;
interface IProps {
  keyword?: boolean;
  onSubmit?: Function;
  keyFilter?: string;
  statuses?: {
    key: string;
    text?: string;
  }[];
  sourceType?: {
    key: string;
    text?: string;
  }[];
  type?: {
    key: string;
    text?: string;
  }[];
  defaultType?: string;
  defaultStatus?: string;
  searchWithPerformer?: boolean;
  performerId?: string;
  searchWithGallery?: boolean;
  galleryId?: string;
  dateRange?: boolean;
}

export class SearchFilter extends PureComponent<IProps> {
  render() {
    const { onSubmit } = this.props;
    const {
      statuses = [],
      searchWithPerformer,
      performerId,
      galleryId,
      searchWithGallery,
      keyFilter,
      dateRange,
      sourceType,
      keyword,
      type,
      defaultType,
      defaultStatus
    } = this.props;
    return (
      <Row gutter={24}>
        {keyword ? (
          <Col lg={6} md={8}>
            <Input
              placeholder="Enter keyword"
              onChange={(evt) => this.setState({ q: evt.target.value })}
              onPressEnter={() => onSubmit(this.state)}
            />
          </Col>
        ) : null}
        {statuses && statuses.length > 0 ? (
          <Col lg={6} md={8}>
            <Select
              onChange={(val) => {
                const objectFilter = keyFilter ? { [keyFilter]: val } : { status: val };
                this.setState(objectFilter, () => onSubmit(this.state));
              }}
              style={{ width: '100%' }}
              placeholder="Select status"
              defaultValue={defaultStatus}
            >
              {statuses.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {type && type.length > 0 ? (
          <Col lg={6} md={8}>
            <Select
              onChange={(val) => {
                const objectFilter = keyFilter ? { [keyFilter]: val } : { type: val };
                this.setState(objectFilter, () => onSubmit(this.state));
              }}
              style={{ width: '100%' }}
              placeholder="Select type"
              defaultValue={defaultType || ''}
            >
              {type.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {sourceType && sourceType.length > 0 ? (
          <Col lg={6} md={8}>
            <Select
              onChange={(val) => {
                const objectFilter = keyFilter ? { [keyFilter]: val } : { sourceType: val };
                this.setState(objectFilter, () => onSubmit(this.state));
              }}
              style={{ width: '100%' }}
              placeholder="Select type"
              defaultValue=""
            >
              {sourceType.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {searchWithPerformer && (
          <Col lg={6} md={8}>
            <SelectPerformerDropdown
              placeholder="Search performer"
              style={{ width: '100%' }}
              onSelect={(val) => this.setState({ performerId: val || '' }, () => onSubmit(this.state))}
              defaultValue={performerId || ''}
            />
          </Col>
        )}
        {searchWithGallery && (
          <Col lg={6} md={8}>
            <SelectGalleryDropdown
              placeholder="Type to search gallery here"
              style={{ width: '100%' }}
              onSelect={(val) => this.setState({ galleryId: val || '' }, () => onSubmit(this.state))}
              defaultValue={galleryId || ''}
            />
          </Col>
        )}
        {dateRange && (
          <Col lg={6} md={8}>
            <RangePicker
              onChange={(dates: [any, any], dateStrings: [string, string]) => this.setState({ fromDate: dateStrings[0], toDate: dateStrings[1] }, () => onSubmit(this.state))}
            />
          </Col>
        )}
      </Row>
    );
  }
}
