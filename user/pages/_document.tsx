import Document, {
  Html, Head, Main, NextScript
} from 'next/document';
import { settingService } from '@services/setting.service';

class CustomDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const resp = await settingService.all();
    const settings = resp.data;
    return {
      ...initialProps,
      settings
    };
  }

  render() {
    const { settings } = this.props as any;
    return (
      <Html>
        <Head>
          <link rel="icon" href={settings.favicon || '/static/favicon.ico'} sizes="64x64" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
          <meta charSet="utf-8" />
          <meta name="keywords" content={settings && settings.metaKeywords} />
          <meta
            name="description"
            content={settings && settings.metaDescription}
          />
          {/* OG tags */}
          <meta
            property="og:title"
            content={settings && settings.siteName}
          />
          <meta property="og:image" content={settings && settings.logoUrl} />
          <meta
            property="og:description"
            content={settings && settings.metaDescription}
          />
          {/* Twitter tags */}
          <meta
            name="twitter:title"
            content={settings && settings.siteName}
          />
          <meta name="twitter:image" content={settings && settings.logoUrl} />
          <meta
            name="twitter:description"
            content={settings && settings.metaDescription}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default CustomDocument;
