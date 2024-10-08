import { Order } from "../entities/order/order";
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

/**
 *
  [buy] && sell -> long -> index
  [buy] && buy -> long -> index + 1
  [buy, sell] && sell -> long -> index
  [buy, sell] && buy -> long -> index +1
  [sell] && sell -> short -> index + 1
  [sell] && buy -> error
 */
export const getNextSequenceIndexByRules = (
  orders: Pick<Order, "side" | "sequenceIndexInSide" | "status">[],
  side: Side
): number => {
  if (orders.length === 0) {
    return 0;
  }

  const isLong =
    orders.every((order) => order.side === "BUY") ||
    (orders.some((order) => order.side === "BUY") &&
      orders.some((order) => order.side === "SELL"));

  const isShort = orders.every((order) => order.side === "SELL");

  const { maxSellSequenceIndex, maxBuySequenceIndex } = orders.reduce<
    Record<"maxSellSequenceIndex" | "maxBuySequenceIndex", number>
  >(
    (maxIndex, order) => {
      if (
        order.side === "SELL" &&
        maxIndex.maxSellSequenceIndex < order.sequenceIndexInSide
      ) {
        maxIndex.maxSellSequenceIndex = order.sequenceIndexInSide;
      } else if (
        order.side === "BUY" &&
        maxIndex.maxBuySequenceIndex < order.sequenceIndexInSide
      ) {
        maxIndex.maxBuySequenceIndex = order.sequenceIndexInSide;
      }

      return maxIndex;
    },
    { maxSellSequenceIndex: -1, maxBuySequenceIndex: -1 }
  );

  if (isLong && maxBuySequenceIndex < maxSellSequenceIndex) {
    throw new Error("There are more sell orders than buy orders");
  }

  if (isShort && side === "BUY") {
    throw new Error(
      'Invalid order configuration: all orders are "sell", but side is "buy".'
    );
  }

  if (isShort) {
    const sequenceIndex = orders.reduce<
      Pick<Order, "side" | "sequenceIndexInSide" | "status"> | undefined
    >((maxOrder, currentOrder) => {
      if (
        !maxOrder ||
        maxOrder.sequenceIndexInSide < currentOrder.sequenceIndexInSide
      ) {
        return currentOrder;
      }
      return maxOrder;
    }, undefined)?.sequenceIndexInSide;

    return (sequenceIndex ?? -1) + 1;
  }

  if (isLong) {
    const sequenceIndex = orders.reduce<
      Pick<Order, "side" | "sequenceIndexInSide" | "status"> | undefined
    >((maxOrder, currentOrder) => {
      if (
        (!maxOrder ||
          maxOrder.sequenceIndexInSide < currentOrder.sequenceIndexInSide) &&
        currentOrder.side === "BUY" &&
        (side === "BUY" || (side === "SELL" && currentOrder.status === "done"))
      ) {
        return currentOrder;
      }
      return maxOrder;
    }, undefined)?.sequenceIndexInSide;

    return side === "SELL" ? sequenceIndex ?? 0 : (sequenceIndex ?? -1) + 1;
  }

  throw new Error(
    "Invalid order configuration: the provided orders and side do not match any valid scenarios."
  );
};

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
