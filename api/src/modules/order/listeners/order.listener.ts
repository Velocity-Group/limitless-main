import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  TOKEN_TRANSACTION_SUCCESS_CHANNEL, PURCHASE_ITEM_TYPE,
  PURCHASE_ITEM_STATUS
} from 'src/modules/token-transaction/constants';
import { EVENT } from 'src/kernel/constants';
import { ProductService } from 'src/modules/performer-assets/services';
import { PRODUCT_TYPE } from 'src/modules/performer-assets/constants';
import { OrderDto } from '../dtos';
import { ORDER_MODEL_PROVIDER } from '../providers';
import { OrderModel } from '../models';
import { ORDER_STATUS } from '../constants';

const ORDER_TOPIC = 'ORDER_TOPIC';

@Injectable()
export class OrderListener {
  constructor(
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(ORDER_MODEL_PROVIDER)
    private readonly orderModel: Model<OrderModel>,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      TOKEN_TRANSACTION_SUCCESS_CHANNEL,
      ORDER_TOPIC,
      this.handleListen.bind(this)
    );
  }

  public async handleListen(
    event: QueueEvent
  ): Promise<OrderDto> {
    if (event.eventName !== EVENT.CREATED) {
      return;
    }
    const transaction = event.data as any;
    if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || (transaction && transaction.type !== PURCHASE_ITEM_TYPE.PRODUCT)) {
      return;
    }
    const { shippingInfo } = transaction;
    const proIds = transaction.products.map((p) => p.productId);
    const products = await this.productService.findByIds(proIds);
    const ids = products.map((p) => p._id.toString());
    if (!ids || !ids.length) {
      return;
    }
    let quantity = 0;
    let totalPrice = 0;
    const newProds = transaction.products.filter((p: any) => ids.includes(p.productId));
    newProds.forEach((p) => {
      quantity += p.quantity;
      totalPrice += parseFloat(p.price);
    });
    await this.orderModel.create({
      transactionId: transaction._id,
      performerId: transaction.performerId,
      userId: transaction.sourceId,
      orderNumber: transaction._id.toString().slice(16, 24).toUpperCase(),
      shippingCode: '',
      postalCode: shippingInfo?.postalCode || transaction?.paymentResponseInfo?.postalCode || '',
      productId: newProds[0].productId,
      unitPrice: products[0].price,
      quantity,
      totalPrice,
      deliveryAddress: shippingInfo.deliveryAddress || '',
      deliveryStatus: newProds[0].productType === PRODUCT_TYPE.DIGITAL ? ORDER_STATUS.DELIVERED : ORDER_STATUS.PROCESSING,
      phoneNumber: shippingInfo?.phoneNumber,
      userNote: shippingInfo?.userNote,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}
