import { ID, Percent, Side, TradingAlgorithm } from "../../types";
import { Order } from "../order/order.types";

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
  status: "active" | "done" | "canceled" | "error";
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

export type CalculateOrderGridType = (params: {
  countOrders: number;
  deposit: string;
  martingale: Percent;
  overlap: Percent;
  currencyPrice: string;
  profit: Percent;
  tradingAlgorithm: TradingAlgorithm;
}) => {
  id: ID;
  price: string;
  quantity: string;
  side: Side;
  status: "active";
  sequenceIndexInSide: number;
}[];
