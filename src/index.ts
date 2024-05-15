import { version } from "../package.json";
import {
  calculateOrderGrid,
  CreateGridParams,
  Grid,
} from "src/entities/grid/grid";
import {
  BaseOrderActionsCallbacks,
  CallbackBaseOrderAction,
  onOrderDoneHandler,
  OnOrderDoneParams,
} from "src/entities/order/order";

export type MartingaleStrategiesType = (
  callbacks: BaseOrderActionsCallbacks | undefined
) => {
  createGrid: (
    params: CreateGridParams,
    createOrderCallback?: CallbackBaseOrderAction
  ) => Grid;
  onOrderDone: (params: OnOrderDoneParams) => {
    isCycleOver: boolean;
    grid: Grid;
  };
};

console.log(`Version ${version} start`);

export const MartingaleStrategies: MartingaleStrategiesType = (callbacks) => ({
  createGrid: (params) => {
    const orders = calculateOrderGrid(params, callbacks?.createOrder);
    return {
      configuration: {
        countOrders: params.countOrders,
        profit: params.profit,
        tradingAlgorithm: params.tradingAlgorithm,
        overlap: params.overlap,
        startPrice: params.startPrice,
        stopLoss: params.stopLoss,
      },
      orders,
    };
  },
  onOrderDone: (params) => {
    const result = onOrderDoneHandler(params, callbacks);

    if (result.isFail) {
      throw new Error(result.value.error);
    }

    return result.value;
  },
});
