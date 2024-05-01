import { ID, Side, TradingAlgorithm } from "../../types";
import { BaseError, Result } from "../../utils/result";
import { Grid } from "../grid/grid.types";

export type MainOrderData = {};

export type Order = {
  id: ID;
  quantity: string;
  price: string;
  side: Side;
  status: "active" | "done" | "cancel";
  sequenceIndexInSide: number;
};

export type StopLimitOrder = {
  id: ID;
  quantity: string;
  price: string;
  stopPrice: string;
  side: Side;
  status: "active" | "done" | "cancel";
  sequenceIndexInSide: number;
};

export type CreateOrderParams = {
  price: string;
  quantity: string;
  side: Side;
};

export type CreateOCOOrderParams = {
  quantity: string;
  side: Side;
  stopPrice: string;
};

export type ShortSellParams = {
  triggerOrder: {
    id: Order["id"];
  };
  grid: {
    configuration: {
      countOrders: Grid["configuration"]["countOrders"];
    };
    orders: Order[];
  };
};

export type LongSellParams = {
  triggerOrder: {
    id: Order["id"];
  };
  grid: {
    orders: Order[];
  };
};

export type LongBuyParams = {
  triggerOrder: {
    id: Order["id"];
  };
  grid: {
    configuration: {
      profit: Grid["configuration"]["profit"];
    };
    orders: Order[];
  };
};

export type LongBuyOCOParams = {
  triggerOrder: {
    id: Order["id"];
  };
  grid: {
    configuration: {
      profit: Grid["configuration"]["profit"];
      stopLoss: Exclude<Grid["configuration"]["stopLoss"], undefined>;
      countOrders: Grid["configuration"]["countOrders"];
      overlap: Grid["configuration"]["overlap"];
      startPrice: Grid["configuration"]["startPrice"];
    };
    orders: Order[];
  };
};

export type ReactiveHandlerType<T> = (params: T) => Result<
  {
    isCycleOver: boolean;
    orders: Order[];
  },
  BaseError
>;

export type OnOrderDoneParams = {
  triggerOrderId: Order["id"];
  grid: Grid;
  cancelOrder?: (id: Order["id"]) => Order["id"];
  createOrder?: (params: CreateOrderParams) => Order;
};

export type OnOrderDoneHandlerType = (params: OnOrderDoneParams) => Result<
  {
    isCycleOver: boolean;
    grid: Grid;
  },
  BaseError
>;
