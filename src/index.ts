import {
  calculateOrderGrid,
  CreateGridParams,
  Grid,
} from "./entities/grid/grid";
import {
  BaseOrderActionsCallbacks,
  CallbackBaseOrderAction,
  onOrderDoneHandler,
  OnOrderDoneParams,
} from "./entities/order/order";

export type MartingaleStrategiesType = (
  callbacks: BaseOrderActionsCallbacks | undefined
) => {
  createGrid: (
    params: CreateGridParams,

    createOrderCallback?: BaseOrderActionsCallbacks["createOrder"]
  ) => Grid;
  onOrderDone: (params: OnOrderDoneParams) => {
    isCycleOver: boolean;
    grid: Grid;
  };
};

export const MartingaleStrategies: MartingaleStrategiesType = (callbacks) => ({
  createGrid: (params) => {
    const orders = calculateOrderGrid(
      { ...params, currencyPrice: params.currencyPriceInStart },
      callbacks?.createOrder
    );
    return {
      configuration: {
        countOrders: params.countOrders,
        profit: params.profit,
        tradingAlgorithm: params.tradingAlgorithm,
        overlap: params.overlap,
        currencyPriceInStart: params.currencyPriceInStart,
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
