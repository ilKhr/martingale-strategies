import { calculateOrderGrid } from "./entities/grid/grid";
import { CreateGridParams, Grid } from "./entities/grid/grid.types";
import { onOrderDoneHandler } from "./entities/order/order";
import { OnOrderDoneParams } from "./entities/order/order.types";

type MartingaleStrategies = {
  createGrid: (params: CreateGridParams) => Grid;
  onOrderDone: (params: OnOrderDoneParams) => {
    isCycleOver: boolean;
    grid: Grid;
  };
};

const MartingaleStrategies: MartingaleStrategies = {
  createGrid: (params) => {
    const orders = calculateOrderGrid(params);
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
    const result = onOrderDoneHandler(params);

    if (result.isFail) {
      throw new Error(result.value.error);
    }

    return result.value;
  },
};
