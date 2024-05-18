import { describe, vi, test, expect, afterEach } from "vitest";
import { MartingaleStrategies } from "./";
import { Grid } from "./entities/grid/grid";

const createOrder = vi.fn();
const cancelOrder = vi.fn();
const createOcoOrder = vi.fn();
const markOrderAsDone = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
});

describe("MartingaleStrategies", () => {
  test("Work correctly with onOrderDone", () => {
    const configuration = {
      countOrders: 10,
      currencyPrice: "100",
      deposit: "1000",
      martingale: 5,
      overlap: 50,
      profit: 1,
      currencyPriceInStart: "100",
      tradingAlgorithm: "LONG",
      stopLoss: 5,
    } as const;

    const instance = MartingaleStrategies({
      createOrder,
      cancelOrder,
      createOcoOrder,
      markOrderAsDone,
    });

    const grid = instance.createGrid(configuration);

    const first = instance.onOrderDone({
      grid: {
        configuration: grid.configuration,
        orders: grid.orders,
      },
      triggerOrderId: 1,
    });

    expect(first).toEqual({
      grid: {
        configuration: {
          countOrders: 10,
          profit: 1,
          tradingAlgorithm: "LONG",
          overlap: 50,
          currencyPriceInStart: "100",
          stopLoss: 5,
        },
        orders: [
          {
            id: 1,
            status: "done",
            sequenceIndexInSide: 0,
            price: "95",
            quantity: "0.83689026279428100526",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 2,
            status: "active",
            sequenceIndexInSide: 1,
            price: "90",
            quantity: "0.92755337459699478083",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 3,
            status: "active",
            sequenceIndexInSide: 2,
            price: "85",
            quantity: "1.03122110469901184457",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 4,
            status: "active",
            sequenceIndexInSide: 3,
            price: "80",
            quantity: "1.1504560449298350891",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 5,
            status: "active",
            sequenceIndexInSide: 4,
            price: "75",
            quantity: "1.28851077032141529979",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 6,
            status: "active",
            sequenceIndexInSide: 5,
            price: "70",
            quantity: "1.44957461661159221227",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 7,
            status: "active",
            sequenceIndexInSide: 6,
            price: "65",
            quantity: "1.63913437416849273233",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 8,
            status: "active",
            sequenceIndexInSide: 7,
            price: "60",
            quantity: "1.86451535061666048303",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 9,
            status: "active",
            sequenceIndexInSide: 8,
            price: "55",
            quantity: "2.13571758343362928056",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 10,
            status: "active",
            sequenceIndexInSide: 9,
            price: "50",
            quantity: "2.46675380886584181904",
            side: "BUY",
            type: "LIMIT",
          },
          {
            id: 11,
            status: "active",
            sequenceIndexInSide: 0,
            price: "95.95",
            quantity: "0.83689026279428100526",
            side: "SELL",
            type: "LIMIT",
          },
        ],
      },
      isCycleOver: false,
    });

    expect(markOrderAsDone).toBeCalledTimes(1);
    expect(createOrder).toBeCalledTimes(11);
    expect(cancelOrder).toBeCalledTimes(0);
    expect(createOcoOrder).toBeCalledTimes(0);
    expect(markOrderAsDone).toBeCalledWith({
      id: 1,
      status: "done",
      sequenceIndexInSide: 0,
      price: "95",
      quantity: "0.83689026279428100526",
      side: "BUY",
      type: "LIMIT",
    });
  });

  test("Work correctly with x10 onOrderDone", () => {
    const configuration = {
      countOrders: 10,
      currencyPrice: "100",
      deposit: "1000",
      martingale: 5,
      overlap: 50,
      profit: 1,
      currencyPriceInStart: "100",
      tradingAlgorithm: "LONG",
      stopLoss: 5,
    } as const;

    const instance = MartingaleStrategies({
      createOrder,
      cancelOrder,
      createOcoOrder,
      markOrderAsDone,
    });

    const grid = instance.createGrid(configuration);

    let result:
      | {
          isCycleOver: boolean;
          grid: Grid;
        }
      | undefined = undefined;

    for (let i = 1; i < 11; i++) {
      result = instance.onOrderDone({
        grid: result?.grid || grid,
        triggerOrderId: i,
      });
    }

    expect(result).toMatchSnapshot();

    expect(markOrderAsDone).toBeCalledTimes(10);
    expect(createOrder).toBeCalledTimes(19);
    expect(cancelOrder).toBeCalledTimes(9);
    expect(createOcoOrder).toBeCalledTimes(1);
    expect(markOrderAsDone).toBeCalledWith({
      id: 1,
      status: "done",
      sequenceIndexInSide: 0,
      price: "95",
      quantity: "0.83689026279428100526",
      side: "BUY",
      type: "LIMIT",
    });
  });
});
