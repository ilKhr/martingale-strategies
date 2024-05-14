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
  BasicOrderActions,
  CreateOCOOrderParams,
  CreateOrderParams,
  LimitOrder,
  LongBuyOCOParams,
  LongBuyParams,
  LongSellParams,
  OcoGroupOrders,
  OnOrderDoneHandlerType,
  Order,
  ReactiveHandlerType,
  ShortSellParams,
  StopLimitOrder,
} from "./order.types";

// Type guard
const hasNotOcoOrder = (orders: Order[]): orders is LimitOrder[] =>
  orders.every((order) => !("orderListId" in order));

// Base Order Actions
/**
 * Mutable grid
 */
export const createAndAddOrder: BasicOrderActions<
  CreateOrderParams,
  LimitOrder["id"]
> = (params, grid, callback): LimitOrder["id"] => {
  const maxIdOrder = getOrderWithMaxId(grid.orders);
  const maxSequenceIndexOrder = getOrderWithMaxSequenceIndex(
    grid.orders,
    params.side
  );

  const newId = (maxIdOrder?.id ?? 0) + 1;

  const newOrder: LimitOrder = {
    id: newId,
    status: "active",
    type: "LIMIT",
    sequenceIndexInSide: (maxSequenceIndexOrder?.sequenceIndexInSide ?? -1) + 1,
    ...params,
  };

  grid.orders.push(newOrder);

  callback && callback(newOrder);

  return newId;
};

/**
 * Mutable grid
 */
const createAndAddOCOOrder: BasicOrderActions<
  CreateOCOOrderParams,
  [LimitOrder["id"], StopLimitOrder["id"]]
> = (params, grid, callback) => {
  if (!hasNotOcoOrder(grid.orders)) {
    throw new Error("OCO order allready created in this grid");
  }

  const maxIdOrder = getOrderWithMaxId(grid.orders);
  const maxSequenceIndexOrder = getOrderWithMaxSequenceIndex(
    grid.orders,
    params.side
  );

  const sequenceIndexInSide =
    (maxSequenceIndexOrder?.sequenceIndexInSide ?? -1) + 1;

  const limitOrderId = (maxIdOrder?.id ?? 0) + 1;
  const stopLimitOrderId = limitOrderId + 1;

  const orderListId = 1;

  const limitOrder: OcoGroupOrders["orders"]["0"] = {
    id: limitOrderId,
    status: "active",
    sequenceIndexInSide,
    price: params.limitOrderPrice,
    type: "LIMIT",
    quantity: params.quantity,
    side: params.side,
    orderListId,
  };

  const stopLimitOrder: OcoGroupOrders["orders"]["1"] = {
    id: stopLimitOrderId,
    status: "active",
    sequenceIndexInSide,
    price: params.stopPrice,
    type: "STOP_LIMIT",
    quantity: params.quantity,
    side: params.side,
    stopPrice: params.stopPrice,
    orderListId,
  };

  const ocoGroupOrders: OcoGroupOrders = {
    orders: [limitOrder, stopLimitOrder],
    type: "OCO",
    sequenceIndexInSide,
  };

  grid.orders.push(limitOrder);
  (
    grid.orders as (
      | OcoGroupOrders["orders"]["0"]
      | OcoGroupOrders["orders"]["1"]
    )[]
  ).push(stopLimitOrder);

  callback && callback(ocoGroupOrders);

  return ocoGroupOrders.orders.map((order) => order.id) as [number, number];
};

/**
 * Mutable grid
 */
const cancelOrder: BasicOrderActions<Order["id"], Order | undefined> = (
  id,
  grid,
  callback
) => {
  const foundIndex = grid.orders.findIndex((order) => order.id === id);

  if (foundIndex === -1) {
    return;
  }

  callback && callback(grid.orders[foundIndex]!);

  grid.orders[foundIndex]!.status = "cancel";

  return grid.orders[foundIndex];
};

/**
 * Mutable grid
 */
const markAsDoneOrder: BasicOrderActions<Order["id"], Order | undefined> = (
  id,
  grid,
  callback
) => {
  const foundIndex = grid.orders.findIndex((order) => order.id === id);

  if (foundIndex === -1) {
    return;
  }

  callback && callback(grid.orders[foundIndex]!);

  grid.orders[foundIndex]!.status = "done";

  return grid.orders[foundIndex];
};

// Grid handlers
export const shortSellHandler: ReactiveHandlerType<
  ShortSellParams,
  LimitOrder
> = (params, callbacks) => {
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

  markAsDoneOrder(
    triggerOrder.id,
    { orders: newOrders },
    callbacks?.markOrderAsDone
  );

  const isTriggerLastOrder =
    params.grid.configuration.countOrders ===
    triggerOrder.sequenceIndexInSide + 1; // because sequence index start from 0

  if (!isTriggerLastOrder) {
    return successWrapper({ orders: newOrders, isCycleOver: false });
  }

  return successWrapper({ orders: newOrders, isCycleOver: true });
};

export const longSellHandler: ReactiveHandlerType<LongSellParams, Order> = (
  params,
  callbacks
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

  markAsDoneOrder(
    params.triggerOrder.id,
    { orders: newOrders },
    callbacks?.markOrderAsDone
  );

  const activeBuyOrders = newOrders.filter(
    (order) => order.status === "active" && order.side === "BUY"
  );

  activeBuyOrders.map((order) =>
    cancelOrder(order.id, { orders: newOrders }, callbacks?.cancelOrder)
  );

  return successWrapper({ isCycleOver: true, orders: newOrders });
};

export const longBuyHandler: ReactiveHandlerType<LongBuyParams, LimitOrder> = (
  params,
  callbacks
) => {
  const newOrders = deepCloneObject(params.grid.orders);

  markAsDoneOrder(
    params.triggerOrder.id,
    { orders: newOrders },
    callbacks?.markOrderAsDone
  );

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
    cancelOrder(
      activeSellOrder.id,
      { orders: newOrders },
      callbacks?.cancelOrder
    );
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
      price: sellCalculated.price,
      quantity: sellCalculated.allQuantity,
      side,
    },
    { orders: newOrders },
    callbacks?.createOrder
  );

  return successWrapper({ isCycleOver: false, orders: newOrders });
};

export const longBuyOCOHandler: ReactiveHandlerType<LongBuyOCOParams, Order> = (
  params,
  callbacks
) => {
  if (!hasNotOcoOrder(params.grid.orders)) {
    throw new Error("OCO order allready created in this grid");
  }

  const newOrders = deepCloneObject(params.grid.orders);

  markAsDoneOrder(
    params.triggerOrder.id,
    { orders: newOrders },
    callbacks?.markOrderAsDone
  );

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

  const isTriggerLastOrder =
    params.grid.configuration.countOrders ===
    triggerOrder.sequenceIndexInSide + 1; // because sequence index start from 0

  const activeSellOrder = newOrders.find(
    (order) => order.side === "SELL" && order.status === "active"
  );

  if (activeSellOrder) {
    cancelOrder(
      activeSellOrder.id,
      { orders: newOrders },
      callbacks?.cancelOrder
    );
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

  if (!isTriggerLastOrder) {
    createAndAddOrder(
      {
        price: sellCalculated.price,
        quantity: sellCalculated.allQuantity,
        side,
      },
      { orders: newOrders },
      callbacks?.createOrder
    );
  } else {
    const stopLossPrice = stopLimitPriceCalculation(
      params.grid.configuration.overlap,
      params.grid.configuration.stopLoss,
      params.grid.configuration.startPrice
    );

    createAndAddOCOOrder(
      {
        quantity: sellCalculated.allQuantity,
        side: "SELL",
        stopPrice: stopLossPrice,
        limitOrderPrice: sellCalculated.price,
      },
      { orders: newOrders },
      callbacks?.createOcoOrder
    );
  }

  return successWrapper({ isCycleOver: false, orders: newOrders });
};

// Use case
export const onOrderDoneHandler: OnOrderDoneHandlerType = (
  params,
  callbacks
) => {
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
    LONG_BUY_OCO: longBuyOCOHandler,
    LONG_SELL: longSellHandler,
    SHORT_SELL: shortSellHandler,
  };

  const key = `${orderAction.value}${
    params.grid.configuration.stopLoss !== undefined ? "_OCO" : ""
  }` as keyof typeof table;

  const resultHandler = table[key](
    {
      grid: {
        configuration: {
          countOrders: params.grid.configuration.countOrders,
          profit: params.grid.configuration.profit,
          overlap: params.grid.configuration.overlap,
          startPrice: params.grid.configuration.startPrice,
          stopLoss: params.grid.configuration.stopLoss as number,
        },
        orders: params.grid.orders as LimitOrder[],
      },
      triggerOrder: {
        id: triggerOrder.id,
      },
    },
    callbacks
  );

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
