import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface IProps {
  onChange: Function;
  html: string;
}

const WYSIWYG = ({ onChange, html }: IProps) => (
  <CKEditor
    editor={ClassicEditor}
    config={{
      removePlugins: ['ImageUpload', 'EasyImage']
    }}
    data={html}
    onChange={(event, editor) => {
      const data = editor.getData();
      onChange(data);
    }}
  />
);

export default WYSIWYG;
