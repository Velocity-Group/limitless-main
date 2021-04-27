/* eslint-disable global-require */
/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { MenuService } from 'src/modules/settings';
import { PostService } from 'src/modules/post/services';
import { PostCreatePayload } from 'src/modules/post/payloads';
import { MenuCreatePayload } from 'src/modules/settings/payloads';
import { UserService } from 'src/modules/user/services';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { replace } from 'lodash';

@Injectable()
export class FooterMenuMigration {
  constructor(
    @Inject(forwardRef(() => MenuService))
    private readonly menuService: MenuService,
    private readonly postService: PostService,
    private readonly userService: UserService
  ) { }

  async up() {
    try {
      // const template = require('mustache');
      const page2257 = readFileSync(join(__dirname, 'contents', '2257.html'))
        .toString();
      const page2257Content = replace(page2257, /DOMAIN/g, process.env.DOMAIN);

      const pageDMCA = readFileSync(join(__dirname, 'contents', 'dmca.html'))
        .toString();
      const pageDMCAContent = replace(pageDMCA, /DOMAIN/g, process.env.DOMAIN);

      const pageToS = readFileSync(join(__dirname, 'contents', 'tos.html'))
        .toString();
      const pageToSContent = replace(pageToS, /DOMAIN/g, process.env.DOMAIN);

      const pagePrivacyAndPolicy = readFileSync(join(__dirname, 'contents', 'privacy_policy.html'))
        .toString();
      const pagePrivacyAndPolicyContent = replace(pagePrivacyAndPolicy, /DOMAIN/g, process.env.DOMAIN);

      const pages = [
        {
          title: 'Term of Service',
          slug: 'tos',
          type: 'post',
          status: 'published',
          shortDescription: 'Term of Service short description',
          content: pageToSContent
        },
        {
          title: 'Privacy & Policy',
          slug: 'privacy_and_policy',
          type: 'post',
          status: 'published',
          shortDescription: 'Privacy & Policy short description',
          content: pagePrivacyAndPolicyContent
        },
        {
          title: 'USC2257',
          slug: 'usc2257',
          type: 'post',
          status: 'published',
          shortDescription: 'USC2257 short description',
          content: page2257Content
        },
        {
          title: 'DMCA',
          slug: 'dmca',
          type: 'post',
          status: 'published',
          shortDescription: 'DMCA short description',
          content: pageDMCAContent

        }
      ] as any;
      // eslint-disable-next-line no-restricted-syntax
      for (const p of pages) {
        const page = await this.postService.findByIdOrSlug(p.slug);
        if (page) {
          console.log(`Page ${page.title} has been existed!`);
        } else {
          const newPage = await this.postService.create(p as PostCreatePayload, null);
          console.log(`Create post ${p.title} success`);
          await this.menuService.create({
            internal: true,
            isNewTab: true,
            parentId: null,
            path: `/page/${newPage.slug}`,
            section: 'footer',
            title: newPage.title
          } as MenuCreatePayload);
          console.log(`Create menu ${newPage.title} success`);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
