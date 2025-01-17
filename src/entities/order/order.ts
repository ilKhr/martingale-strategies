import {
  deepCloneObject,
  determineOrderAction,
  findOrderById,
  getNextSequenceIndexByRules,
  getOrderWithMaxId,
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

import { ID, Side } from "../../types";
import { Result, BaseError } from "../../utils/result";
import { Grid } from "../grid/grid";

type OrderType = "OCO" | "LIMIT" | "STOP_LIMIT";

type OcoOrderTypes = "limit" | "stop-limit";

export type LimitOrder = {
  id: ID;
  quantity: string;
  price: string;
  side: Side;
  type: Extract<OrderType, "LIMIT">;
  status: "active" | "done" | "canceled";
  sequenceIndexInSide: number;
  oco: {
    isOco: false;
  };
};

export type OcoLimitOrder = {
  id: ID;
  quantity: string;
  price: string;
  side: Side;
  type: Extract<OrderType, "LIMIT">;
  status: "active" | "done" | "canceled";
  sequenceIndexInSide: number;
  oco: {
    isOco: true;
    ocoType: Extract<OcoOrderTypes, "limit">;
  };
};

export type OcoStopLimitOrder = {
  id: ID;
  quantity: string;
  price: string;
  type: Extract<OrderType, "STOP_LIMIT">;
  side: Side;
  status: "active" | "done" | "canceled";
  sequenceIndexInSide: number;
  oco: {
    isOco: true;
    ocoType: Extract<OcoOrderTypes, "stop-limit">;
    stopPrice: string;
  };
};

export type Order = LimitOrder | OcoLimitOrder | OcoStopLimitOrder;

export type OcoGroupOrders = {
  type: Extract<OrderType, "OCO">;
  sequenceIndexInSide: number;
  orders: [OcoLimitOrder, OcoStopLimitOrder];
};

export type CreateOrderParams = {
  price: string;
  quantity: string;
  side: Side;
};

export type CreateOCOOrderParams = {
  quantity: string;
  side: Side;
  limitOrderPrice: string;
  stopPrice: string;
};

export type ShortSellParams = {
  triggerOrder: {
    id: LimitOrder["id"];
  };
  grid: {
    configuration: {
      countOrders: Grid["configuration"]["countOrders"];
    };
    orders: LimitOrder[];
  };
};

export type LongSellParams = {
  triggerOrder: {
    id: LimitOrder["id"];
  };
  grid: {
    orders: LimitOrder[];
  };
};

export type LongBuyParams = {
  triggerOrder: {
    id: LimitOrder["id"];
  };
  grid: {
    configuration: {
      profit: Grid["configuration"]["profit"];
    };
    orders: LimitOrder[];
  };
};

export type LongBuyOCOParams = {
  triggerOrder: {
    id: LimitOrder["id"];
  };
  grid: {
    configuration: {
      profit: Grid["configuration"]["profit"];
      stopLoss: Exclude<Grid["configuration"]["stopLoss"], undefined>;
      countOrders: Grid["configuration"]["countOrders"];
      overlap: Grid["configuration"]["overlap"];
      currencyPriceInStart: Grid["configuration"]["currencyPriceInStart"];
    };
    orders: (LimitOrder | OcoLimitOrder | OcoStopLimitOrder)[];
  };
};

export type LongSellOCOParams = {
  triggerOrder: {
    id: LimitOrder["id"];
  };
  grid: {
    orders: (LimitOrder | OcoLimitOrder | OcoStopLimitOrder)[];
  };
};

export type ReactiveHandlerType<T, OrderType extends Order | LimitOrder> = (
  params: T,
  callbacks: BaseOrderActionsCallbacks | undefined
) => Result<
  {
    isCycleOver: boolean;
    orders: OrderType[];
  },
  BaseError
>;

export type OnOrderDoneParams = {
  triggerOrderId: LimitOrder["id"];
  grid: Grid;
};

export type CallbackBaseOrderAction<
  ParamsType extends
    | LimitOrder
    | OcoLimitOrder
    | OcoStopLimitOrder
    | OcoGroupOrders
> = (param: ParamsType) => unknown;

export type BaseOrderActionsCallbacks = {
  createOrder: CallbackBaseOrderAction<Order>;
  cancelOrder: CallbackBaseOrderAction<Order>;
  markOrderAsDone: CallbackBaseOrderAction<Order>;
  createOcoOrder: CallbackBaseOrderAction<OcoGroupOrders>;
};

export type BasicOrderAction<
  Params,
  ReturnValue,
  Callback extends BaseOrderActionsCallbacks[keyof BaseOrderActionsCallbacks]
> = (
  params: Params,
  grid: { orders: Grid["orders"] },
  callback: Callback | undefined
) => ReturnValue;

export type OnOrderDoneHandlerType = (
  params: OnOrderDoneParams,
  callbacks: BaseOrderActionsCallbacks | undefined
) => Result<
  {
    isCycleOver: boolean;
    grid: Grid;
  },
  BaseError
>;

// type guard
const isOcoOrder = (order: Order): order is OcoLimitOrder | OcoStopLimitOrder =>
  order.oco.isOco;

// Base Order Actions
/**
 * Mutable grid
 */
export const createAndAddOrder: BasicOrderAction<
  CreateOrderParams,
  LimitOrder["id"],
  BaseOrderActionsCallbacks["createOrder"]
> = (params, grid, callback): LimitOrder["id"] => {
  const maxIdOrder = getOrderWithMaxId(grid.orders);
  const nextSequenceIndex = getNextSequenceIndexByRules(
    grid.orders,
    params.side
  );

  const newId = (maxIdOrder?.id ?? 0) + 1;

  const newOrder: LimitOrder = {
    id: newId,
    status: "active",
    type: "LIMIT",
    sequenceIndexInSide: nextSequenceIndex,
    oco: { isOco: false },
    ...params,
  };

  grid.orders.push(newOrder);

  callback && callback(newOrder);

  return newId;
};

/**
 * Mutable grid
 */
const createAndAddOCOOrder: BasicOrderAction<
  CreateOCOOrderParams,
  [OcoLimitOrder["id"], OcoStopLimitOrder["id"]],
  BaseOrderActionsCallbacks["createOcoOrder"]
> = (params, grid, callback) => {
  if (grid.orders.some((order) => order.oco.isOco)) {
    throw new Error("OCO order allready created in this grid");
  }

  const maxIdOrder = getOrderWithMaxId(grid.orders);
  const nextSequenceIndex = getNextSequenceIndexByRules(
    grid.orders,
    params.side
  );

  const sequenceIndexInSide = nextSequenceIndex;

  const limitOrderId = (maxIdOrder?.id ?? 0) + 1;
  const stopLimitOrderId = limitOrderId + 1;

  const limitOrder: OcoGroupOrders["orders"]["0"] = {
    id: limitOrderId,
    status: "active",
    sequenceIndexInSide,
    price: params.limitOrderPrice,
    type: "LIMIT",
    quantity: params.quantity,
    side: params.side,
    oco: {
      isOco: true,
      ocoType: "limit",
    },
  };

  const stopLimitOrder: OcoGroupOrders["orders"]["1"] = {
    id: stopLimitOrderId,
    status: "active",
    sequenceIndexInSide,
    price: params.stopPrice,
    type: "STOP_LIMIT",
    quantity: params.quantity,
    side: params.side,
    oco: {
      isOco: true,
      ocoType: "stop-limit",
      stopPrice: params.stopPrice,
    },
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
const cancelOrder: BasicOrderAction<
  Order["id"],
  Order | undefined,
  BaseOrderActionsCallbacks["cancelOrder"]
> = (id, grid, callback) => {
  const foundIndex = grid.orders.findIndex((order) => order.id === id);

  if (foundIndex === -1) {
    return;
  }

  callback && callback(grid.orders[foundIndex]!);

  grid.orders[foundIndex]!.status = "canceled";

  return grid.orders[foundIndex];
};

/**
 * Mutable grid
 */
const markAsDoneOrder: BasicOrderAction<
  Order["id"],
  Order | undefined,
  BaseOrderActionsCallbacks["createOrder"]
> = (id, grid, callback) => {
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
  /*
  If done we have first limit, then we do done limit and cancelled stop limit
  If done we have stopLimit, then we do cancelled Limit and create a limit-by-stop-limit-order (important, this must be a separate handler).
  If the limit-by-stop-limit-order is triggered, we just mark it as done
  */
  if (params.grid.orders.some((order) => order.oco.isOco)) {
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

  const isTriggerLastOrder =
    params.grid.configuration.countOrders ===
    triggerOrder.sequenceIndexInSide + 1; // because sequence index start from 0

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
      params.grid.configuration.currencyPriceInStart
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

export const longSellOCOHandler: ReactiveHandlerType<
  LongSellOCOParams,
  Order
> = (params, callbacks) => {
  if (!params.grid.orders.some((order) => isOcoOrder(order))) {
    throw new Error("OCO order not exists in this grid");
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

  if (triggerOrder.side !== "SELL") {
    return failWrapper(
      badRequestError(
        `longBuyOCOHandler: triggerOrder side is: ${triggerOrder.side}, but expected \"SELL\"`
      )
    );
  }

  if (!isOcoOrder(triggerOrder)) {
    throw new Error(`Trigger order should be OCO`);
  }

  const typeToOposite: Record<OcoOrderTypes, OcoOrderTypes> = {
    limit: "stop-limit",
    "stop-limit": "limit",
  };

  const opositeOrder = newOrders.find(
    (order) =>
      order.oco.isOco &&
      order.oco.ocoType === typeToOposite[triggerOrder.oco.ocoType]
  );

  if (!opositeOrder) {
    throw new Error(
      `Oposite order for ${triggerOrder.oco.ocoType} order not exists`
    );
  }

  cancelOrder(opositeOrder.id, { orders: newOrders }, callbacks?.cancelOrder);

  return successWrapper({ isCycleOver: true, orders: newOrders });
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
    LONG_SELL_OCO: longSellOCOHandler,
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
          currencyPriceInStart: params.grid.configuration.currencyPriceInStart,
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
