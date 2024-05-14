import {
  LongCalculationPayload,
  ShortCalculationPayload,
  longCalculation,
  shortCalculation,
} from "../../utils/formulas";
import { createAndAddOrder } from "../order/order";
import { LimitOrder } from "../order/order.types";
import { CalculateOrderGridType } from "./grid.types";

export const calculateOrderGrid: CalculateOrderGridType = (
  params,
  createOrderCallback
) => {
  const orderGrid: LimitOrder[] = [];

  for (
    let sequenceIndexInSide = 0;
    sequenceIndexInSide < params.countOrders;
    sequenceIndexInSide++
  ) {
    const isLongOrder = params.tradingAlgorithm === "LONG";

    const calculationArgument:
      | LongCalculationPayload
      | ShortCalculationPayload = Object.assign({}, params, {
      sequenceIndexInSide: sequenceIndexInSide,
    });

    const { priceWithIntent, quantity } = isLongOrder
      ? longCalculation(calculationArgument)
      : shortCalculation(calculationArgument);

    // TODO: calculate price with exchange filter
    // TODO: calculate quantity with exchange filter

    createAndAddOrder(
      {
        price: priceWithIntent.toString(),
        quantity: quantity.toString(),
        side: isLongOrder ? "BUY" : "SELL",
      },
      { orders: orderGrid },
      createOrderCallback
    );
  }

  return orderGrid;
};
