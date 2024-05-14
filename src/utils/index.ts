import { Order } from "../entities/order/order.types";
import { ID, Side, TradingAlgorithm } from "../types";
import {
  badRequestError,
  BaseError,
  failWrapper,
  Result,
  successWrapper,
} from "./result";

export const deepCloneObject = <T>(data: T): T =>
  JSON.parse(JSON.stringify(data));

export const getOrderWithMaxId = (orders: Order[]): Order | undefined => {
  return orders.reduce<Order | undefined>((maxOrder, currentOrder) => {
    if (!maxOrder || maxOrder.id < currentOrder.id) {
      maxOrder = currentOrder;
    }
    return maxOrder;
  }, undefined);
};

export const getOrderWithMaxSequenceIndex = (
  orders: Order[],
  side: Side
): Order | undefined =>
  orders.reduce<Order | undefined>((maxOrder, currentOrder) => {
    if (
      (!maxOrder ||
        maxOrder.sequenceIndexInSide < currentOrder.sequenceIndexInSide) &&
      currentOrder.side === side
    ) {
      maxOrder = currentOrder;
    }
    return maxOrder;
  }, undefined);

export const determineOrderAction = (
  tradingAlgorithm: TradingAlgorithm,
  triggerOrderSide: Side
): Result<"LONG_BUY" | "LONG_SELL" | "SHORT_SELL", BaseError> => {
  const table = {
    LONG_BUY: "LONG_BUY",
    LONG_SELL: "LONG_SELL",
    SHORT_SELL: "SHORT_SELL",
  } as const;

  const key = `${tradingAlgorithm}_${triggerOrderSide}` as const;

  if (!(key in table)) {
    return failWrapper(
      badRequestError(`determineOrderAction: Action ${key} is not valid`)
    );
  }

  return successWrapper(table[key as keyof typeof table]);
};

export const findOrderById = (
  orders: Order[],
  findOrderId: ID
): Order | undefined => orders.find((order) => order.id === findOrderId);
