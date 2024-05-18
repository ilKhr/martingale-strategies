import {
  longCalculation,
  LongCalculationPayload,
  shortCalculation,
  ShortCalculationPayload,
} from "../../utils/formulas";
import {
  BaseOrderActionsCallbacks,
  createAndAddOrder,
  LimitOrder,
  Order,
} from "../order/order";

import { Percent, TradingAlgorithm } from "../../types";

export type Grid = {
  orders: Order[];
  configuration: {
    tradingAlgorithm: TradingAlgorithm;
    countOrders: number;
    profit: number;
    overlap: number;
    startPrice: string;
    stopLoss?: number;
  };
};

export type CreateGridParams = {
  countOrders: number;
  deposit: string;
  martingale: Percent;
  overlap: Percent;
  currencyPrice: string;
  profit: Percent;
  tradingAlgorithm: TradingAlgorithm;
  startPrice: string;
  stopLoss?: number;
};

export type CalculateOrderGridType = (
  params: {
    countOrders: number;
    deposit: string;
    martingale: Percent;
    overlap: Percent;
    currencyPrice: string;
    profit: Percent;
    tradingAlgorithm: TradingAlgorithm;
  },
  createOrderCallback?: BaseOrderActionsCallbacks["createOrder"]
) => LimitOrder[];

export const calculateOrderGrid: CalculateOrderGridType = (
  params,
  createOrderCallback
) => {
  const orderGrid: LimitOrder[] = [];

  for (
    let sequenceIndexInSide = 0;
    sequenceIndexInSide < params.countOrders;
    sequenceIndexInSide++
  ) {
    const isLongOrder = params.tradingAlgorithm === "LONG";

    const calculationArgument:
      | LongCalculationPayload
      | ShortCalculationPayload = Object.assign({}, params, {
      sequenceIndexInSide: sequenceIndexInSide,
    });

    const { priceWithIntent, quantity } = isLongOrder
      ? longCalculation(calculationArgument)
      : shortCalculation(calculationArgument);

    // TODO: calculate price with exchange filter
    // TODO: calculate quantity with exchange filter

    createAndAddOrder(
      {
        price: priceWithIntent.toString(),
        quantity: quantity.toString(),
        side: isLongOrder ? "BUY" : "SELL",
      },
      { orders: orderGrid },
      createOrderCallback
    );
  }

  return orderGrid;
};
