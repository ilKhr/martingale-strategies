import { describe, expect, test } from "vitest";
import {
  LimitOrder,
  longBuyHandler,
  longBuyOCOHandler,
  LongBuyOCOParams,
  LongBuyParams,
  longSellHandler,
  longSellOCOHandler,
  LongSellOCOParams,
  LongSellParams,
  shortSellHandler,
  ShortSellParams,
} from "./order";

import { deepCloneObject } from "../../utils";

describe("shortSellHandler", () => {
  const normalOrder: LimitOrder = {
    id: 1,
    price: "10",
    quantity: "10",
    sequenceIndexInSide: 0,
    side: "SELL",
    status: "active",
    type: "LIMIT",
    oco: {
      isOco: false,
    },
  } as const;

  describe("Correctness of returned values", () => {
    test("should mark cycle as over if trigger order is last in the grid", () => {
      const triggerOrderId = 2;
      const sequenceIndexInSide = 2;

      const params: ShortSellParams = {
        triggerOrder: {
          id: triggerOrderId,
        },
        grid: {
          configuration: { countOrders: 3 },
          orders: [
            {
              ...normalOrder,
              sequenceIndexInSide,
              id: triggerOrderId,
            },
          ],
        },
      };
      const result = shortSellHandler(params, undefined);

      expect(result.value).toEqual({
        orders: [
          {
            ...normalOrder,
            status: "done",
            sequenceIndexInSide,
            id: triggerOrderId,
          },
        ],
        isCycleOver: true,
      });
    });

    test("should mark cycle as not over if trigger order is not last in the grid", () => {
      const triggerOrderId = 2;

      const params: ShortSellParams = {
        triggerOrder: {
          id: triggerOrderId,
        },
        grid: {
          configuration: { countOrders: 3 },
          orders: [
            {
              ...normalOrder,
              id: triggerOrderId,
            },
          ],
        },
      };
      const result = shortSellHandler(params, undefined);

      expect(result.value).toEqual({
        orders: [
          {
            ...normalOrder,
            status: "done",
            id: triggerOrderId,
          },
        ],
        isCycleOver: false,
      });
    });

    test("should return isFail object if orders not has trigger order", () => {
      const params: ShortSellParams = {
        triggerOrder: {
          id: 2,
        },
        grid: { configuration: { countOrders: 3 }, orders: [] },
      };
      const result = shortSellHandler(params, undefined);
      expect(result).toEqual({
        value: {
          error: "shortSellHandler: triggerOrder not exist: id:2",
          code: 400,
          message: undefined,
        },
        isFail: true,
      });
    });

    test("should mark trigger order as done", () => {
      const triggerOrderId = 1;

      const params: ShortSellParams = {
        triggerOrder: { id: triggerOrderId },
        grid: {
          configuration: { countOrders: 1 },
          orders: [{ ...normalOrder, id: triggerOrderId }],
        },
      };
      const result = shortSellHandler(params, undefined);

      if (result.isFail) {
        throw new Error("Here fail");
      }

      expect(result.value.orders[0]?.status).toBe("done");
    });
  });

  describe("Calculations", () => {
    test("should mark trigger order as done and is CycleOver false if not last order", () => {
      const resultCalculations = shortSellHandler(
        {
          grid: {
            configuration: {
              countOrders: 2,
            },
            orders: [
              {
                ...normalOrder,
                id: 1,
                price: "79.5",
                quantity: "0.84",
                sequenceIndexInSide: 0,
              },
              {
                ...normalOrder,
                price: "162.98",
                id: 2,
                quantity: "0.93",
                sequenceIndexInSide: 1,
              },
            ],
          },
          triggerOrder: { id: 1 },
        },
        undefined
      );

      expect(resultCalculations).toEqual({
        value: {
          orders: [
            {
              id: 1,
              price: "79.5",
              quantity: "0.84",
              sequenceIndexInSide: 0,
              side: "SELL",
              status: "done",
              type: "LIMIT",
              oco: {
                isOco: false,
              },
            },
            {
              id: 2,
              price: "162.98",
              quantity: "0.93",
              sequenceIndexInSide: 1,
              side: "SELL",
              status: "active",
              type: "LIMIT",
              oco: {
                isOco: false,
              },
            },
          ],
          isCycleOver: false,
        },
        isFail: false,
      });
    });

    test("should mark trigger order as done and is CycleOver:true if last order", () => {
      const resultCalculations = shortSellHandler(
        {
          grid: {
            configuration: {
              countOrders: 2,
            },
            orders: [
              {
                ...normalOrder,

                id: 1,
                price: "79.5",
                quantity: "0.84",
                sequenceIndexInSide: 0,
                status: "done",
              },
              {
                ...normalOrder,
                price: "162.98",
                id: 2,
                quantity: "0.93",
                sequenceIndexInSide: 1,
              },
            ],
          },
          triggerOrder: { id: 2 },
        },
        undefined
      );

      expect(resultCalculations).toEqual({
        value: {
          orders: [
            {
              id: 1,
              price: "79.5",
              quantity: "0.84",
              sequenceIndexInSide: 0,
              side: "SELL",
              status: "done",
              type: "LIMIT",
              oco: {
                isOco: false,
              },
            },
            {
              id: 2,
              price: "162.98",
              quantity: "0.93",
              sequenceIndexInSide: 1,
              side: "SELL",
              status: "done",
              type: "LIMIT",
              oco: {
                isOco: false,
              },
            },
          ],
          isCycleOver: true,
        },
        isFail: false,
      });
    });
  });
});

describe("longSellHandler", () => {
  const normalOrder: LimitOrder = {
    id: 1,
    price: "10",
    quantity: "10",
    sequenceIndexInSide: 0,
    side: "BUY",
    status: "active",
    type: "LIMIT",
    oco: {
      isOco: false,
    },
  } as const;

  describe("Correctness of returned values", () => {
    test("should mark cycle as over if trigger order is last in the grid", () => {
      const triggerOrderId = 2;
      const sequenceIndexInSide = 2;

      const params: LongSellParams = {
        triggerOrder: {
          id: triggerOrderId,
        },
        grid: {
          orders: [
            {
              ...normalOrder,
              side: "SELL",
              sequenceIndexInSide,
              id: triggerOrderId,
            },
          ],
        },
      };
      const result = longSellHandler(params, undefined);

      expect(result.value).toEqual({
        orders: [
          {
            ...normalOrder,
            side: "SELL",
            status: "done",
            sequenceIndexInSide,
            id: triggerOrderId,
          },
        ],
        isCycleOver: true,
      });
    });

    test("should mark cycle as over if trigger order is not last in the grid", () => {
      const triggerOrderId = 2;

      const params: LongSellParams = {
        triggerOrder: {
          id: triggerOrderId,
        },
        grid: {
          orders: [
            {
              ...normalOrder,
              side: "SELL",
              id: triggerOrderId,
            },
          ],
        },
      };
      const result = longSellHandler(params, undefined);

      expect(result.value).toEqual({
        orders: [
          {
            ...normalOrder,
            side: "SELL",
            status: "done",
            id: triggerOrderId,
          },
        ],
        isCycleOver: true,
      });
    });

    test("should return isFail object if orders not has trigger order", () => {
      const params: LongSellParams = {
        triggerOrder: {
          id: 2,
        },
        grid: { orders: [] },
      };
      const result = longSellHandler(params, undefined);
      expect(result).toEqual({
        value: {
          error: "longSellHandler: triggerOrder not exist: id:2",
          code: 400,
          message: undefined,
        },
        isFail: true,
      });
    });

    test("should mark trigger order as done", () => {
      const triggerOrderId = 1;

      const params: LongSellParams = {
        triggerOrder: { id: triggerOrderId },
        grid: {
          orders: [{ ...normalOrder, side: "SELL", id: triggerOrderId }],
        },
      };
      const result = longSellHandler(params, undefined);

      if (result.isFail) {
        throw new Error("Here fail");
      }

      expect(result.value.orders[0]?.status).toBe("done");
    });
  });

  describe("Calculations", () => {
    const orders = [
      {
        ...normalOrder,
        id: 1,
        price: "83.33",
        quantity: "3.81",
        sequenceIndexInSide: 0,
      },
      {
        ...normalOrder,
        price: "66.67",
        id: 2,
        quantity: "5",
        sequenceIndexInSide: 1,
      },
      {
        ...normalOrder,
        price: "50",
        id: 3,
        quantity: "6.99",
        sequenceIndexInSide: 2,
      },
      {
        ...normalOrder,
        side: "SELL",
        price: "84.17",
        id: 4,
        quantity: "3.81",
        sequenceIndexInSide: 0,
      },
      {
        ...normalOrder,
        side: "SELL",
        price: "74.61",
        id: 5,
        quantity: "8.80",
        sequenceIndexInSide: 1,
      },
      {
        ...normalOrder,
        side: "SELL",
        price: "63.94",
        id: 6,
        quantity: "15.8",
        sequenceIndexInSide: 2,
      },
    ] as const;

    test("should correct mark orders if first sell order done", () => {
      const localOrders = deepCloneObject(orders.slice(0, 4));

      const first = longSellHandler(
        {
          grid: {
            orders: localOrders,
          },
          triggerOrder: { id: 4 },
        },
        undefined
      );

      expect(first).toEqual({
        value: {
          isCycleOver: true,
          orders: [
            {
              ...orders[0],
              status: "canceled",
            },
            {
              ...orders[1],
              status: "canceled",
            },
            {
              ...orders[2],
              status: "canceled",
            },
            {
              ...orders[3],
              status: "done",
            },
          ],
        },
        isFail: false,
      });
    });

    test("should mark trigger order as done, mark next buy orders as canceled and is CycleOver true if middle order", () => {
      const localOrders = deepCloneObject(orders.slice(0, 5));

      const first = longSellHandler(
        {
          grid: {
            orders: localOrders,
          },
          triggerOrder: { id: 5 },
        },
        undefined
      );

      expect(first).toEqual({
        value: {
          isCycleOver: true,
          orders: [
            {
              ...orders[0],
              status: "canceled",
            },
            {
              ...orders[1],
              status: "canceled",
            },
            {
              ...orders[2],
              status: "canceled",
            },
            {
              ...orders[3],
              status: "active",
            },
            {
              ...orders[4],
              status: "done",
            },
          ],
        },
        isFail: false,
      });
    });

    test("should mark trigger order as done, mark next buy orders as canceled and is CycleOver true if last order", () => {
      const localOrders = deepCloneObject(orders.slice(0, 6));

      const first = longSellHandler(
        {
          grid: {
            orders: localOrders,
          },
          triggerOrder: { id: 6 },
        },
        undefined
      );

      expect(first).toEqual({
        value: {
          isCycleOver: true,
          orders: [
            {
              ...orders[0],
              status: "canceled",
            },
            {
              ...orders[1],
              status: "canceled",
            },
            {
              ...orders[2],
              status: "canceled",
            },
            {
              ...orders[3],
              status: "active",
            },
            {
              ...orders[4],
              status: "active",
            },
            {
              ...orders[5],
              status: "done",
            },
          ],
        },
        isFail: false,
      });
    });
  });
});

describe("longBuyHandler", () => {
  const normalOrder: LimitOrder = {
    id: 1,
    price: "10",
    quantity: "10",
    sequenceIndexInSide: 0,
    side: "BUY",
    status: "active",
    type: "LIMIT",
    oco: {
      isOco: false,
    },
  } as const;

  const configuration = {
    profit: 1,
  };

  describe("Correctness of returned values", () => {
    test("should mark cycle as not over if trigger order is last in the grid", () => {
      const triggerOrderId = 2;
      const sequenceIndexInSide = 2;

      const params: LongBuyParams = {
        triggerOrder: {
          id: triggerOrderId,
        },
        grid: {
          configuration,
          orders: [
            {
              ...normalOrder,
              sequenceIndexInSide,
              id: triggerOrderId,
            },
          ],
        },
      };
      const result = longBuyHandler(params, undefined);

      expect(result.value).toEqual({
        orders: [
          {
            ...normalOrder,
            status: "done",
            sequenceIndexInSide,
            id: triggerOrderId,
          },
          {
            id: 3,
            price: "10.1",
            quantity: "10",
            sequenceIndexInSide: 2,
            side: "SELL",
            status: "active",
            type: "LIMIT",
            oco: {
              isOco: false,
            },
          },
        ],
        isCycleOver: false,
      });
    });

    test("should return isFail object if orders not has trigger order", () => {
      const params: LongBuyParams = {
        triggerOrder: {
          id: 2,
        },
        grid: { configuration, orders: [] },
      };
      const result = longBuyHandler(params, undefined);
      expect(result).toEqual({
        value: {
          error: "longBuyHandler: triggerOrder not exist: id:2",
          code: 400,
          message: undefined,
        },
        isFail: true,
      });
    });

    test("should mark trigger order as done", () => {
      const triggerOrderId = 1;

      const params: LongBuyParams = {
        triggerOrder: { id: triggerOrderId },
        grid: {
          configuration,
          orders: [{ ...normalOrder, id: triggerOrderId }],
        },
      };
      const result = longBuyHandler(params, undefined);

      if (result.isFail) {
        throw new Error("Here fail");
      }

      expect(result.value.orders[0]?.status).toBe("done");
    });

    test("should mark as canceled prev sell order if trigger buy order", () => {
      const triggerOrderId = 2;
      const sequenceIndexInSide = 1;

      const params: LongBuyParams = {
        triggerOrder: { id: triggerOrderId },
        grid: {
          configuration,
          orders: [
            {
              ...normalOrder,
              id: triggerOrderId - 1,
              status: "done",
              sequenceIndexInSide: sequenceIndexInSide - 1,
            },
            {
              ...normalOrder,
              id: 10,
              side: "SELL",
              sequenceIndexInSide: sequenceIndexInSide - 1,
            },
            {
              ...normalOrder,
              id: triggerOrderId,
              side: "BUY",
              sequenceIndexInSide,
            },
          ],
        },
      };
      const result = longBuyHandler(params, undefined);

      if (result.isFail) {
        throw new Error("Here fail");
      }

      expect(result.value.orders[1]?.status).toBe("canceled");
    });
  });

  describe("Calculations", () => {
    const orders = [
      {
        ...normalOrder,
        id: 1,
        price: "83.33",
        quantity: "3.81",
        sequenceIndexInSide: 0,
      },
      {
        ...normalOrder,
        price: "66.67",
        id: 2,
        quantity: "5",
        sequenceIndexInSide: 1,
      },
      {
        ...normalOrder,
        price: "50",
        id: 3,
        quantity: "6.99",
        sequenceIndexInSide: 2,
      },
      {
        ...normalOrder,
        side: "SELL",
        price: "84.1633",
        id: 4,
        quantity: "3.81",
        sequenceIndexInSide: 0,
      },
      {
        ...normalOrder,
        side: "SELL",
        price: "74.61358376844494892168",
        id: 5,
        quantity: "8.81",
        sequenceIndexInSide: 1,
      },
      {
        ...normalOrder,
        side: "SELL",
        price: "63.94561221518987341772",
        id: 6,
        quantity: "15.8",
        sequenceIndexInSide: 2,
      },
    ] as const;

    test("should correct calculate sell order first", () => {
      const resultCalculations = longBuyHandler(
        {
          grid: {
            configuration: {
              profit: 1,
            },
            orders: orders.slice(0, 1),
          },
          triggerOrder: { id: 1 },
        },
        undefined
      );

      expect(resultCalculations).toEqual({
        value: {
          isCycleOver: false,
          orders: [
            {
              ...orders[0],
              status: "done",
            },
            {
              ...orders[3],
              id: 2,
            },
          ],
        },
        isFail: false,
      });
    });

    test("should correct calculate sell order second", () => {
      const localOrders = deepCloneObject(orders.slice(0, 3));
      const first = longBuyHandler(
        {
          grid: {
            configuration: {
              profit: 1,
            },
            orders: localOrders,
          },
          triggerOrder: { id: 1 },
        },
        undefined
      );

      if (first.isFail) {
        throw new Error(first.value.error);
      }

      const second = longBuyHandler(
        {
          grid: {
            configuration: {
              profit: 1,
            },
            orders: first.value.orders,
          },
          triggerOrder: { id: 2 },
        },
        undefined
      );

      expect(second).toEqual({
        value: {
          isCycleOver: false,
          orders: [
            {
              ...orders[0],
              status: "done",
            },
            {
              ...orders[1],
              status: "done",
            },
            orders[2],
            {
              ...orders[3],
              status: "canceled",
            },
            orders[4],
          ],
        },
        isFail: false,
      });
    });

    test("should correct calculate sell order last", () => {
      const localOrders = deepCloneObject(orders.slice(0, 3));
      const first = longBuyHandler(
        {
          grid: {
            configuration,
            orders: localOrders,
          },
          triggerOrder: { id: 1 },
        },
        undefined
      );

      if (first.isFail) {
        throw new Error(first.value.error);
      }

      const second = longBuyHandler(
        {
          grid: {
            configuration,
            orders: first.value.orders,
          },
          triggerOrder: { id: 2 },
        },
        undefined
      );

      if (second.isFail) {
        throw new Error(second.value.error);
      }

      const third = longBuyHandler(
        {
          grid: {
            configuration,
            orders: second.value.orders,
          },
          triggerOrder: { id: 3 },
        },
        undefined
      );

      expect(third).toEqual({
        value: {
          isCycleOver: false,
          orders: [
            {
              ...orders[0],
              status: "done",
            },
            {
              ...orders[1],
              status: "done",
            },
            { ...orders[2], status: "done" },
            {
              ...orders[3],
              status: "canceled",
            },
            {
              ...orders[4],
              status: "canceled",
            },
            orders[5],
          ],
        },
        isFail: false,
      });
    });
  });
});

describe("longBuyOCOHandler", () => {
  const normalOrder: LimitOrder = {
    id: 1,
    price: "10",
    quantity: "10",
    sequenceIndexInSide: 0,
    side: "BUY",
    status: "active",
    type: "LIMIT",
    oco: {
      isOco: false,
    },
  } as const;

  const configuration = {
    countOrders: 3,
    overlap: 50,
    profit: 1,
    currencyPriceInStart: "100",
    stopLoss: 5,
  };

  describe("Correctness of returned values", () => {
    test("should mark cycle as not over if trigger order is last in the grid", () => {
      const triggerOrderId = 2;
      const sequenceIndexInSide = 2;

      const params: LongBuyOCOParams = {
        triggerOrder: {
          id: triggerOrderId,
        },
        grid: {
          configuration,
          orders: [
            {
              ...normalOrder,
              sequenceIndexInSide,
              id: triggerOrderId,
            },
          ],
        },
      };
      const result = longBuyOCOHandler(params, undefined);

      expect(result.value).toEqual({
        orders: [
          {
            ...normalOrder,
            status: "done",
            sequenceIndexInSide,
            id: triggerOrderId,
          },
          {
            id: 3,
            price: "10.1",
            quantity: "10",
            sequenceIndexInSide: 2,
            side: "SELL",
            status: "active",
            type: "LIMIT",
            oco: {
              isOco: true,
              ocoType: "limit",
            },
          },
          {
            id: 4,
            price: "45",
            quantity: "10",
            sequenceIndexInSide: 2,
            side: "SELL",
            status: "active",
            type: "STOP_LIMIT",
            oco: {
              isOco: true,
              stopPrice: "45",
              ocoType: "stop-limit",
            },
          },
        ],
        isCycleOver: false,
      });
    });

    test("should return isFail object if orders not has trigger order", () => {
      const params: LongBuyOCOParams = {
        triggerOrder: {
          id: 2,
        },
        grid: { configuration, orders: [] },
      };
      const result = longBuyOCOHandler(params, undefined);
      expect(result).toEqual({
        value: {
          error: "longBuyOCOHandler: triggerOrder not exist: id:2",
          code: 400,
          message: undefined,
        },
        isFail: true,
      });
    });

    test("should mark trigger order as done", () => {
      const triggerOrderId = 1;

      const params: LongBuyOCOParams = {
        triggerOrder: { id: triggerOrderId },
        grid: {
          configuration,
          orders: [{ ...normalOrder, id: triggerOrderId }],
        },
      };
      const result = longBuyOCOHandler(params, undefined);

      if (result.isFail) {
        throw new Error("Here fail");
      }

      expect(result.value.orders[0]?.status).toBe("done");
    });

    test("should mark as canceled prev sell order if trigger buy order", () => {
      const triggerOrderId = 2;
      const sequenceIndexInSide = 1;

      const params: LongBuyOCOParams = {
        triggerOrder: { id: triggerOrderId },
        grid: {
          configuration,
          orders: [
            {
              ...normalOrder,
              id: triggerOrderId - 1,
              status: "done",
              sequenceIndexInSide: sequenceIndexInSide - 1,
            },
            {
              ...normalOrder,
              id: 10,
              side: "SELL",
              sequenceIndexInSide: sequenceIndexInSide - 1,
            },
            {
              ...normalOrder,
              id: triggerOrderId,
              side: "BUY",
              sequenceIndexInSide,
            },
          ],
        },
      };
      const result = longBuyOCOHandler(params, undefined);

      if (result.isFail) {
        throw new Error("Here fail");
      }

      expect(result.value.orders[1]?.status).toBe("canceled");
    });
  });

  describe("Calculations", () => {
    const orders: LimitOrder[] = [
      {
        ...normalOrder,
        id: 1,
        price: "83.33",
        quantity: "3.81",
        sequenceIndexInSide: 0,
      },
      {
        ...normalOrder,
        price: "66.67",
        id: 2,
        quantity: "5",
        sequenceIndexInSide: 1,
      },
      {
        ...normalOrder,
        price: "50",
        id: 3,
        quantity: "6.99",
        sequenceIndexInSide: 2,
      },
      {
        ...normalOrder,
        side: "SELL",
        price: "84.1633",
        id: 4,
        quantity: "3.81",
        sequenceIndexInSide: 0,
      },
      {
        ...normalOrder,
        side: "SELL",
        price: "74.61358376844494892168",
        id: 5,
        quantity: "8.81",
        sequenceIndexInSide: 1,
      },
      {
        ...normalOrder,
        side: "SELL",
        price: "63.94561221518987341772",
        id: 6,
        quantity: "15.8",
        sequenceIndexInSide: 2,
      },
    ] as const;

    test("should correct calculate sell order first", () => {
      const resultCalculations = longBuyOCOHandler(
        {
          grid: {
            configuration,
            orders: orders.slice(0, 1),
          },
          triggerOrder: { id: 1 },
        },
        undefined
      );

      expect(resultCalculations).toEqual({
        value: {
          isCycleOver: false,
          orders: [
            {
              ...orders[0],
              status: "done",
            },
            {
              ...orders[3],
              id: 2,
            },
          ],
        },
        isFail: false,
      });
    });

    test("should correct calculate sell order second", () => {
      const localOrders = deepCloneObject(orders.slice(0, 3));
      const first = longBuyOCOHandler(
        {
          grid: {
            configuration,
            orders: localOrders,
          },
          triggerOrder: { id: 1 },
        },
        undefined
      );

      if (first.isFail) {
        throw new Error(first.value.error);
      }

      const second = longBuyOCOHandler(
        {
          grid: {
            configuration,
            orders: first.value.orders as LimitOrder[],
          },
          triggerOrder: { id: 2 },
        },
        undefined
      );

      expect(second).toEqual({
        value: {
          isCycleOver: false,
          orders: [
            {
              ...orders[0],
              status: "done",
            },
            {
              ...orders[1],
              status: "done",
            },
            orders[2],
            {
              ...orders[3],
              status: "canceled",
            },
            orders[4],
          ],
        },
        isFail: false,
      });
    });

    test("should correct calculate sell order last", () => {
      const localOrders = deepCloneObject(orders.slice(0, 3));
      const first = longBuyOCOHandler(
        {
          grid: {
            configuration,
            orders: localOrders,
          },
          triggerOrder: { id: 1 },
        },
        undefined
      );

      if (first.isFail) {
        throw new Error(first.value.error);
      }

      const second = longBuyOCOHandler(
        {
          grid: {
            configuration,
            orders: first.value.orders as LimitOrder[],
          },
          triggerOrder: { id: 2 },
        },
        undefined
      );

      if (second.isFail) {
        throw new Error(second.value.error);
      }

      const third = longBuyOCOHandler(
        {
          grid: {
            configuration,
            orders: second.value.orders as LimitOrder[],
          },
          triggerOrder: { id: 3 },
        },
        undefined
      );

      expect(third).toEqual({
        value: {
          isCycleOver: false,
          orders: [
            {
              ...orders[0],
              status: "done",
            },
            {
              ...orders[1],
              status: "done",
            },
            { ...orders[2], status: "done" },
            {
              ...orders[3],
              status: "canceled",
            },
            {
              ...orders[4],
              status: "canceled",
            },
            {
              ...orders[5],
              oco: {
                isOco: true,
                ocoType: "limit",
              },
            },
            {
              ...orders[5],
              sequenceIndexInSide: 2,

              id: 7,
              price: "45",
              type: "STOP_LIMIT",
              oco: {
                isOco: true,
                ocoType: "stop-limit",
                stopPrice: "45",
              },
            },
          ],
        },
        isFail: false,
      });
    });
  });
});

describe("longSellOcoHandler", () => {
  const normalOrder: LimitOrder = {
    id: 1,
    price: "10",
    quantity: "10",
    sequenceIndexInSide: 0,
    side: "BUY",
    status: "active",
    type: "LIMIT",
    oco: {
      isOco: false,
    },
  } as const;

  const configuration = {
    countOrders: 3,
    overlap: 50,
    profit: 1,
    currencyPriceInStart: "100",
    stopLoss: 5,
  };

  describe("Correctness of returned values", () => {
    test("should canceled stop loss if trigger limit OCO order", () => {
      const triggerOrderId = 2;
      const sequenceIndexInSide = 2;

      const paramsForCreateOco: LongBuyOCOParams = {
        triggerOrder: {
          id: triggerOrderId,
        },
        grid: {
          configuration,
          orders: [
            {
              ...normalOrder,
              sequenceIndexInSide,
              id: triggerOrderId,
            },
          ],
        },
      };
      const afterCreateOcoResult = longBuyOCOHandler(
        paramsForCreateOco,
        undefined
      );

      if (afterCreateOcoResult.isFail) {
        throw afterCreateOcoResult.value;
      }

      const paramsForTriggerOcoLimit: LongSellOCOParams = {
        triggerOrder: {
          id: afterCreateOcoResult.value.orders.find(
            (order) => order.oco.isOco && order.oco.ocoType === "limit"
          )!.id,
        },
        grid: {
          orders: afterCreateOcoResult.value.orders,
        },
      };

      const result = longSellOCOHandler(paramsForTriggerOcoLimit, undefined);

      expect(result.value).toEqual({
        orders: [
          {
            ...normalOrder,
            status: "done",
            sequenceIndexInSide,
            id: triggerOrderId,
          },
          {
            id: 3,
            price: "10.1",
            quantity: "10",
            sequenceIndexInSide,
            side: "SELL",
            status: "done",
            type: "LIMIT",
            oco: {
              isOco: true,
              ocoType: "limit",
            },
          },
          {
            id: 4,
            price: "45",
            quantity: "10",
            sequenceIndexInSide,
            side: "SELL",
            status: "canceled",
            type: "STOP_LIMIT",
            oco: {
              isOco: true,
              ocoType: "stop-limit",
              stopPrice: "45",
            },
          },
        ],
        isCycleOver: true,
      });
    });

    test("should create limit by stop limit if trigger stop limit OCO order", () => {
      const triggerOrderId = 2;
      const sequenceIndexInSide = 2;

      const paramsForCreateOco: LongBuyOCOParams = {
        triggerOrder: {
          id: triggerOrderId,
        },
        grid: {
          configuration,
          orders: [
            {
              ...normalOrder,
              sequenceIndexInSide,
              id: triggerOrderId,
            },
          ],
        },
      };
      const afterCreateOcoResult = longBuyOCOHandler(
        paramsForCreateOco,
        undefined
      );

      if (afterCreateOcoResult.isFail) {
        throw afterCreateOcoResult.value;
      }

      const paramsForTriggerOcoLimit: LongSellOCOParams = {
        triggerOrder: {
          id: afterCreateOcoResult.value.orders.find(
            (order) => order.oco.isOco && order.oco.ocoType === "stop-limit"
          )!.id,
        },
        grid: {
          orders: afterCreateOcoResult.value.orders,
        },
      };

      const result = longSellOCOHandler(paramsForTriggerOcoLimit, undefined);

      expect(result.value).toEqual({
        orders: [
          {
            ...normalOrder,
            status: "done",
            sequenceIndexInSide,
            id: triggerOrderId,
          },
          {
            id: 3,
            price: "10.1",
            quantity: "10",
            sequenceIndexInSide,
            side: "SELL",
            status: "canceled",
            type: "LIMIT",
            oco: {
              isOco: true,
              ocoType: "limit",
            },
          },
          {
            id: 4,
            price: "45",
            quantity: "10",
            sequenceIndexInSide,
            side: "SELL",
            status: "done",
            type: "STOP_LIMIT",
            oco: {
              isOco: true,
              ocoType: "stop-limit",
              stopPrice: "45",
            },
          },
        ],
        isCycleOver: true,
      });
    });
  });
});
