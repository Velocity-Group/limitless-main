import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { TOKEN_TRANSACTION_SUCCESS_CHANNEL, PURCHASE_ITEM_TYPE } from 'src/modules/token-transaction/constants';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { EVENT } from 'src/kernel/constants';
import { MailerService } from 'src/modules/mailer/services';
import { PerformerService } from 'src/modules/performer/services';
import { AuthService } from 'src/modules/auth/services';
import { pick } from 'lodash';
import { UserService } from 'src/modules/user/services';
import { ProductService } from '../services';
import { PRODUCT_TYPE } from '../constants';

const UPDATE_STOCK_CHANNEL = 'UPDATE_STOCK_CHANNEL';

@Injectable()
export class StockProductListener {
  constructor(
    private readonly authService: AuthService,
    private readonly queueEventService: QueueEventService,
    private readonly productService: ProductService,
    private readonly mailService: MailerService,
    private readonly fileService: FileService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {
    this.queueEventService.subscribe(
      TOKEN_TRANSACTION_SUCCESS_CHANNEL,
      UPDATE_STOCK_CHANNEL,
      this.handleStockProducts.bind(this)
    );
  }

  public async handleStockProducts(event: QueueEvent) {
    if (![EVENT.CREATED].includes(event.eventName)) {
      return false;
    }
    const transaction = event.data;
    if (transaction.type !== PURCHASE_ITEM_TYPE.PRODUCT || !transaction.products || !transaction.products.length) {
      return false;
    }
    const prodIds = transaction.products.map((p) => p.productId);
    const performer = await this.performerService.findById(transaction.performerId);
    const user = await this.userService.findById(transaction.sourceId);
    const products = await this.productService.findByIds(prodIds);
    products.forEach((prod) => {
      if (prod.type === PRODUCT_TYPE.PHYSICAL) {
        const p = transaction.products.find((produ) => `${produ.productId}` === `${prod._id}`);
        this.productService.updateStock(prod._id, -(p.quantity || 1));
      }
      if (prod.type === PRODUCT_TYPE.DIGITAL && prod.digitalFileId) {
        this.sendDigitalProductLink(
          transaction,
          performer,
          user,
          prod.digitalFileId
        );
      }
    });
    return true;
  }

  public async sendDigitalProductLink(transaction, performer, user, fileId) {
    const auth = await this.authService.findBySource({ source: 'user', type: 'email', sourceId: transaction.sourceId }) || await this.authService.findBySource({ source: 'user', type: 'username', sourceId: transaction.sourceId });
    const jwToken = this.authService.generateJWT(pick(auth, ['_id', 'source', 'sourceId']), { expiresIn: 3 * 60 * 60 }); // 3hours expiration
    const file = await this.fileService.findById(fileId);
    if (file) {
      const digitalLink = jwToken ? `${new FileDto(file).getUrl()}?productId=${transaction.targetId}&token=${jwToken}` : new FileDto(file).getUrl();
      user && user.email && await this.mailService.send({
        subject: 'Digital file',
        to: user.email,
        data: {
          performer,
          user,
          transaction,
          digitalLink
        },
        template: 'send-user-digital-product'
      });
    }
  }
}
