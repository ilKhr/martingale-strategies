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

export type MartingaleStrategiesType = () => {
  createGrid: (
    params: CreateGridParams,
    callbacks?: {
      createOrder: BaseOrderActionsCallbacks["createOrder"];
    }
  ) => Grid;
  onOrderDone: (
    params: OnOrderDoneParams,
    callbacks?: BaseOrderActionsCallbacks
  ) => {
    isCycleOver: boolean;
    grid: Grid;
  };
};

export const MartingaleStrategies: MartingaleStrategiesType = () => ({
  createGrid: (params, callbacks) => {
    const orders = calculateOrderGrid(
      {
        ...params,
        currencyPrice: params.currencyPriceInStart,
      },
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
  onOrderDone: (params, callbacks) => {
    const result = onOrderDoneHandler(params, callbacks);

    if (result.isFail) {
      throw new Error(result.value.error);
    }

    return result.value;
  },
});
