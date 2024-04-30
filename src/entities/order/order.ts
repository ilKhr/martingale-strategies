import {
  deepCloneObject,
  determineOrderAction,
  findOrderById,
  getOrderWithMaxId,
  getOrderWithMaxSequenceIndex,
} from "../../utils";
import {
  sellLongCalculation,
  stopLimitPriceCalculation,
} from "../../utils/formulas";
import {
  badRequestError,
  failWrapper,
  successWrapper,
} from "../../utils/result";
import {
  CreateOCOOrderParams,
  CreateOrderParams,
  LongBuyOCOParams,
  LongBuyParams,
  LongSellParams,
  OnOrderDoneHandlerType,
  Order,
  ReactiveHandlerType,
  ShortSellParams,
  StopLimitOrder,
} from "./order.types";

// Base Order Actions
/**
 * Mutable grid
 */
const createAndAddOrder = (
  params: CreateOrderParams,
  grid: { orders: Order[] }
): Order["id"] => {
  const maxIdOrder = getOrderWithMaxId(grid.orders);
  const maxSequenceIndexOrder = getOrderWithMaxSequenceIndex(
    grid.orders,
    params.side
  );

  const newId = (maxIdOrder?.id ?? 0) + 1;

  const newOrder: Order = {
    id: newId,
    status: "active",
    sequenceIndexInSide: (maxSequenceIndexOrder?.sequenceIndexInSide ?? -1) + 1,
    ...params,
  };

  grid.orders.push(newOrder);

  return newId;
};

/**
 * Mutable grid
 */
const createAndStopLimitOrder = (
  params: CreateOCOOrderParams,
  grid: { orders: Order[] }
): Order["id"] => {
  const maxIdOrder = getOrderWithMaxId(grid.orders);
  const maxSequenceIndexOrder = getOrderWithMaxSequenceIndex(
    grid.orders,
    params.side
  );

  const newId = (maxIdOrder?.id ?? 0) + 1;

  const stopLimitOrder: StopLimitOrder = {
    id: newId,
    status: "active",
    sequenceIndexInSide: (maxSequenceIndexOrder?.sequenceIndexInSide ?? -1) + 1,
    price: params.stopPrice,
    quantity: params.quantity,
    side: params.side,
    stopPrice: params.stopPrice,
  };

  grid.orders.push(stopLimitOrder);

  return newId;
};

/**
 * Mutable grid
 */
const cancelOrder = (
  id: Order["id"],
  grid: { orders: Order[] }
): Order["id"] | undefined => {
  const result = grid.orders.some((order) => {
    if (order.id === id) {
      order.status = "cancel";
      return true;
    }
    return false;
  });

  return result ? id : undefined;
};

/**
 * Mutable grid
 */
const markAsDoneOrder = (
  id: Order["id"],
  grid: { orders: Order[] }
): Order["id"] | undefined => {
  const result = grid.orders.some((order) => {
    if (order.id === id) {
      order.status = "done";
      return true;
    }
    return false;
  });

  return result ? id : undefined;
};

// Grid handlers
export const shortSellHandler: ReactiveHandlerType<ShortSellParams> = (
  params
) => {
  const newOrders = deepCloneObject(params.grid.orders);

  const triggerOrder = findOrderById(newOrders, params.triggerOrder.id);

  if (!triggerOrder) {
    return failWrapper(
      badRequestError(
        `shortSellHandler: triggerOrder not exist: id:${params.triggerOrder.id}`
      )
    );
  }

  if (triggerOrder.side !== "SELL") {
    return failWrapper(
      badRequestError(
        `shortSellHandler: triggerOrder side is: ${triggerOrder.side}, but expected \"SELL\"`
      )
    );
  }

  markAsDoneOrder(triggerOrder.id, { orders: newOrders });

  const isTriggerLastOrder =
    params.grid.configuration.countOrders ===
    triggerOrder.sequenceIndexInSide + 1; // because sequence index start from 0

  if (!isTriggerLastOrder) {
    return successWrapper({ orders: newOrders, isCycleOver: false });
  }

  return successWrapper({ orders: newOrders, isCycleOver: true });
};

export const longSellHandler: ReactiveHandlerType<LongSellParams> = (
  params
) => {
  const newOrders = deepCloneObject(params.grid.orders);

  const triggerOrder = findOrderById(newOrders, params.triggerOrder.id);

  if (!triggerOrder) {
    return failWrapper(
      badRequestError(
        `longSellHandler: triggerOrder not exist: id:${params.triggerOrder.id}`
      )
    );
  }

  if (triggerOrder.side !== "SELL") {
    return failWrapper(
      badRequestError(
        `longSellHandler: triggerOrder side is: ${triggerOrder.side}, but expected \"SELL\"`
      )
    );
  }

  markAsDoneOrder(params.triggerOrder.id, { orders: newOrders });

  const activeBuyOrders = newOrders.filter(
    (order) => order.status === "active" && order.side === "BUY"
  );

  activeBuyOrders.map((order) => cancelOrder(order.id, { orders: newOrders }));

  return successWrapper({ isCycleOver: true, orders: newOrders });
};

export const longBuyHandler: ReactiveHandlerType<LongBuyParams> = (params) => {
  const newOrders = deepCloneObject(params.grid.orders);

  markAsDoneOrder(params.triggerOrder.id, { orders: newOrders });

  const triggerOrder = findOrderById(newOrders, params.triggerOrder.id);

  if (!triggerOrder) {
    return failWrapper(
      badRequestError(
        `longBuyHandler: triggerOrder not exist: id:${params.triggerOrder.id}`
      )
    );
  }

  if (triggerOrder.side !== "BUY") {
    return failWrapper(
      badRequestError(
        `longBuyHandler: triggerOrder side is: ${triggerOrder.side}, but expected \"BUY\"`
      )
    );
  }

  const activeSellOrder = newOrders.find(
    (order) => order.side === "SELL" && order.status === "active"
  );

  if (activeSellOrder) {
    cancelOrder(activeSellOrder.id, { orders: newOrders });
  }

  const doneOrders = newOrders.filter((order) => order.status === "done");

  const sellCalculated = sellLongCalculation({
    priceQuantity: doneOrders.map(({ price, quantity }) => ({
      price,
      quantity,
    })),
    profit: params.grid.configuration.profit,
  });

  const side = "SELL";

  createAndAddOrder(
    {
      price: sellCalculated.price.toString(),
      quantity: sellCalculated.allQuantity.toString(),
      side,
    },
    { orders: newOrders }
  );

  return successWrapper({ isCycleOver: false, orders: newOrders });
};

export const longBuyOCOHandler: ReactiveHandlerType<LongBuyOCOParams> = (
  params
) => {
  const newOrders = deepCloneObject(params.grid.orders);

  markAsDoneOrder(params.triggerOrder.id, { orders: newOrders });

  const triggerOrder = findOrderById(newOrders, params.triggerOrder.id);

  if (!triggerOrder) {
    return failWrapper(
      badRequestError(
        `longBuyOCOHandler: triggerOrder not exist: id:${params.triggerOrder.id}`
      )
    );
  }

  if (triggerOrder.side !== "BUY") {
    return failWrapper(
      badRequestError(
        `longBuyOCOHandler: triggerOrder side is: ${triggerOrder.side}, but expected \"BUY\"`
      )
    );
  }

  const result = longBuyHandler({
    grid: {
      orders: newOrders,
      configuration: params.grid.configuration,
    },
    triggerOrder: params.triggerOrder,
  });

  const isTriggerLastOrder =
    params.grid.configuration.countOrders ===
    triggerOrder.sequenceIndexInSide + 1; // because sequence index start from 0

  if (!isTriggerLastOrder || result.isFail) {
    return result;
  }

  const stopLossPrice = stopLimitPriceCalculation(
    params.grid.configuration.overlap,
    params.grid.configuration.stopLoss,
    params.grid.configuration.startPrice
  );

  const lastSellOrder = result.value.orders[
    result.value.orders.length - 1
  ] as Order;

  createAndStopLimitOrder(
    {
      quantity: lastSellOrder?.quantity,
      side: "SELL",
      stopPrice: stopLossPrice,
    },
    { orders: result.value.orders }
  );

  return successWrapper({ isCycleOver: false, orders: result.value.orders });
};

// Use case
export const onOrderDoneHandler: OnOrderDoneHandlerType = (params) => {
  const triggerOrder = findOrderById(params.grid.orders, params.triggerOrderId);

  if (!triggerOrder) {
    return failWrapper(
      badRequestError(
        `onOrderDoneHandler: TriggerOrder not exist. order id: ${params.triggerOrderId}`
      )
    );
  }

  const orderAction = determineOrderAction(
    params.grid.configuration.tradingAlgorithm,
    triggerOrder?.side
  );

  if (orderAction.isFail) {
    return orderAction;
  }

  const table = {
    LONG_BUY: longBuyHandler,
    LONG_SELL: longSellHandler,
    SHORT_SELL: shortSellHandler,
  };

  const resultHandler = table[orderAction.value]({
    grid: {
      configuration: {
        countOrders: params.grid.configuration.countOrders,
        profit: params.grid.configuration.profit,
      },
      orders: params.grid.orders.filter(
        ({ side }) => side === "SELL"
      ) as (Order & { side: "SELL" })[],
    },
    triggerOrder: {
      id: triggerOrder.id,
    },
  });

  if (resultHandler.isFail) {
    return resultHandler;
  }

  return successWrapper({
    grid: {
      ...params.grid,
      orders: resultHandler.value.orders,
    },
    isCycleOver: resultHandler.value.isCycleOver,
  });
};
