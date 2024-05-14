import { CreateGridParams, Grid } from "src/entities/grid/grid.types";
import {
  BaseOrderActionsCallbacks,
  CallbackBaseOrderAction,
  OnOrderDoneParams,
} from "src/entities/order/order.types";

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
