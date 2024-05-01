import { Order } from "entities/order/order.types";
import {
  LongCalculationPayload,
  ShortCalculationPayload,
  longCalculation,
  shortCalculation,
} from "../../utils/formulas";
import { CalculateOrderGridType } from "./grid.types";

export const calculateOrderGrid: CalculateOrderGridType = (params) => {
  const orderGrid: Order[] = [];

  let orderIdCounter = 1;

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

    orderGrid.push({
      id: orderIdCounter++,
      price: priceWithIntent.toString(),
      quantity: quantity.toString(),
      side: isLongOrder ? "BUY" : "SELL",
      status: "active",
      sequenceIndexInSide: sequenceIndexInSide,
    });
  }

  return orderGrid;
};
