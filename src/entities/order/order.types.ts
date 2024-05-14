import { Grid } from "src/entities/grid/grid.types";
import { ID, Side } from "src/types";
import { Result, BaseError } from "src/utils/result";

type OrderType = "OCO" | "LIMIT" | "STOP_LIMIT";

export type LimitOrder = {
  id: ID;
  quantity: string;
  price: string;
  side: Side;
  type: Extract<OrderType, "LIMIT">;
  status: "active" | "done" | "cancel";
  sequenceIndexInSide: number;
  orderListId?: number;
};

export type StopLimitOrder = {
  id: ID;
  quantity: string;
  price: string;
  stopPrice: string;
  type: Extract<OrderType, "STOP_LIMIT">;
  side: Side;
  status: "active" | "done" | "cancel";
  sequenceIndexInSide: number;
  orderListId?: number;
};

export type Order = LimitOrder | StopLimitOrder;

export type OcoGroupOrders = {
  type: Extract<OrderType, "OCO">;
  sequenceIndexInSide: number;
  orders: [
    LimitOrder & { orderListId: number },
    StopLimitOrder & { orderListId: number }
  ];
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
      startPrice: Grid["configuration"]["startPrice"];
    };
    orders: LimitOrder[];
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
  cancelOrder?: (id: LimitOrder["id"]) => LimitOrder["id"];
  createOrder?: (params: CreateOrderParams) => LimitOrder;
};

export type CallbackBaseOrderAction = (
  param: LimitOrder | StopLimitOrder | OcoGroupOrders
) => unknown;

export type BasicOrderActions<Params, ReturnValue> = (
  params: Params,
  grid: { orders: Grid["orders"] },
  callback: CallbackBaseOrderAction | undefined
) => ReturnValue;

export type BaseOrderActionsCallbacks = Record<
  "createOrder" | "cancelOrder" | "createOcoOrder" | "markOrderAsDone",
  CallbackBaseOrderAction
>;

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
