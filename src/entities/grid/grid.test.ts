import { describe, expect, test } from "vitest";
import { calculateOrderGrid, CalculateOrderGridType } from "./grid";

const normalOrderGridParamObjectLong: Parameters<CalculateOrderGridType>[0] = {
  countOrders: 10,
  currencyPrice: "120",
  deposit: "555",
  martingale: 47,
  overlap: 12,
  tradingAlgorithm: "LONG",
  profit: 9,
};

const normalOrderGridParamObject2Long: Parameters<CalculateOrderGridType>[0] = {
  countOrders: 4,
  currencyPrice: "1450",
  deposit: "2000",
  martingale: 20,
  overlap: 15,
  tradingAlgorithm: "LONG",
  profit: 5,
};

const normalOrderGridParamObject2Short: Parameters<CalculateOrderGridType>[0] =
  {
    countOrders: 4,
    currencyPrice: "1450",
    deposit: "2000",
    martingale: 20,
    overlap: 15,
    tradingAlgorithm: "SHORT",
    profit: 5,
  };

describe("calculateOrderGrid", () => {
  test("should work correctly with normal param object", () => {
    const result = calculateOrderGrid(normalOrderGridParamObjectLong);
    expect(result).toEqual([
      {
        id: 1,
        price: "118.56",
        quantity: "0.04770852377147806407",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 0,
        type: "LIMIT",
      },
      {
        id: 2,
        price: "117.12",
        quantity: "0.07099380285322118969",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 1,
        type: "LIMIT",
      },
      {
        id: 3,
        price: "115.68",
        quantity: "0.10565998841242064863",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 2,
        type: "LIMIT",
      },
      {
        id: 4,
        price: "114.24",
        quantity: "0.15727800039860614785",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 3,
        type: "LIMIT",
      },
      {
        id: 5,
        price: "112.8",
        quantity: "0.23415013284875041229",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 4,
        type: "LIMIT",
      },
      {
        id: 6,
        price: "111.36",
        quantity: "0.34865156634741737036",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 5,
        type: "LIMIT",
      },
      {
        id: 7,
        price: "109.92",
        quantity: "0.51923200955075641916",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 6,
        type: "LIMIT",
      },
      {
        id: 8,
        price: "108.48",
        quantity: "0.77340297068615545745",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 7,
        type: "LIMIT",
      },
      {
        id: 9,
        price: "107.04",
        quantity: "1.15219701758454962364",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 8,
        type: "LIMIT",
      },
      {
        id: 10,
        price: "105.6",
        quantity: "1.71682592879268732785",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 9,
        type: "LIMIT",
      },
    ]);
  });

  test("should work correctly with normal param object 2 [LONG]", () => {
    const result = calculateOrderGrid(normalOrderGridParamObject2Long);
    expect(result).toEqual([
      {
        id: 1,
        price: "1395.625",
        quantity: "0.26696157021456368802",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 0,
        type: "LIMIT",
      },
      {
        id: 2,
        price: "1341.25",
        quantity: "0.33334120388953628072",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 1,
        type: "LIMIT",
      },
      {
        id: 3,
        price: "1286.875",
        quantity: "0.41691125218860312293",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 2,
        type: "LIMIT",
      },
      {
        id: 4,
        price: "1232.5",
        quantity: "0.52236527480101450108",
        side: "BUY",
        status: "active",
        sequenceIndexInSide: 3,
        type: "LIMIT",
      },
    ]);
  });

  test("should work correctly with normal param object 2 [SHORT]", () => {
    const result = calculateOrderGrid(normalOrderGridParamObject2Short);

    expect(result).toEqual([
      {
        id: 1,
        price: "1504.375",
        quantity: "372.57824143070044709389",
        side: "SELL",
        status: "active",
        sequenceIndexInSide: 0,
        type: "LIMIT",
      },
      {
        id: 2,
        price: "1558.75",
        quantity: "447.093889716840536512668",
        side: "SELL",
        status: "active",
        sequenceIndexInSide: 1,
        type: "LIMIT",
      },
      {
        id: 3,
        price: "1613.125",
        quantity: "536.5126676602086438152016",
        side: "SELL",
        status: "active",
        sequenceIndexInSide: 2,
        type: "LIMIT",
      },
      {
        id: 4,
        price: "1667.5",
        quantity: "643.81520119225037257824192",
        side: "SELL",
        status: "active",
        sequenceIndexInSide: 3,
        type: "LIMIT",
      },
    ]);
  });

  test("should create correct number of orders", () => {
    const countOrders = 5;
    const result = calculateOrderGrid({
      ...normalOrderGridParamObjectLong,
      countOrders,
    });
    expect(result).toHaveLength(countOrders);
  });

  test("should create correct side for different trading algorithms", () => {
    const longResult = calculateOrderGrid({
      ...normalOrderGridParamObjectLong,
      countOrders: 1,
      tradingAlgorithm: "LONG",
    });
    const shortResult = calculateOrderGrid({
      ...normalOrderGridParamObjectLong,
      countOrders: 1,
      tradingAlgorithm: "SHORT" /* other params */,
    });
    expect(longResult[0]?.side).toBe("BUY");
    expect(shortResult[0]?.side).toBe("SELL");
  });
});
