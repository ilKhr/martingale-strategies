import Big from "big.js";
import { describe, expect, test } from "vitest";
import {
  //   countLongProfit,
  //   countShortProfit,
  getAllCount,
  getCorrection,
  getCountFromMartingale,
  getCountFromMartingaleBysequenceIndexInSide,
  getCountWithCorrection,
  getCountWithSumCorrectionLong,
  getIndent,
  getMartingaleCoefficientFromPercent,
  //   getPercentage,
  getPriceWithIndent,
  getSumWithCorrection,
  getSumWithCountCorrectionShort,
  getVolumeByPrice,
  longCalculation,
  sellLongCalculation,
  shortCalculation,
  stopLimitPriceCalculation,
} from "./formulas";
import { TradingAlgorithm } from "../types";

// describe('getPercentage', () => {
//   test('Should calculate the correct percentage for numbers', () => {
//     expect(getPercentage(100, 50)).toBe('50');
//     expect(getPercentage(200, 25)).toBe('50');
//     expect(getPercentage(75, 10)).toBe('7.5');
//   });

//   test('Should calculate the correct percentage for strings', () => {
//     expect(getPercentage('100', '50')).toBe('50');
//     expect(getPercentage('200', '25')).toBe('50');
//     expect(getPercentage('75', '10')).toBe('7.5');
//   });

//   test('Should handle decimal values correctly', () => {
//     expect(getPercentage(0.1, 50)).toBe('0.05');
//     expect(getPercentage(0.5, 25)).toBe('0.125');
//     expect(getPercentage(0.75, 10)).toBe('0.075');
//   });

//   test('Should handle negative values correctly', () => {
//     expect(getPercentage(-100, 50)).toBe('-50');
//     expect(getPercentage(-200, 25)).toBe('-50');
//     expect(getPercentage(-75, 10)).toBe('-7.5');
//   });
// });

describe("Base trading formulas", () => {
  const getVolumeByPriceData = [
    {
      price: 100,
      overlap: 50,
      result: "50",
    },
    {
      price: 120,
      overlap: 80,
      result: "96",
    },
    {
      price: 270,
      overlap: 15,
      result: "40.5",
    },
  ];
  test.each(getVolumeByPriceData)(
    "getVolumeByPrice work correct with %s",
    (data) => {
      const { price, overlap, result } = data;
      const volume = getVolumeByPrice(new Big(price), overlap);

      expect(volume.toString()).toBe(result);
    }
  );

  const sellLongCalculationData = [
    {
      priceQuantity: [
        {
          quantity: "0.058825754814803",
          price: "96.1538461538462",
        },
      ],
      profit: 1,
      result: {
        allQuantity: "0.058825754814803",
        // price: '97.1153846153846'
        price: "97.115384615384662",
      },
    },
    {
      priceQuantity: [
        {
          quantity: "0.02941287740740150",
          price: "192.3076923076920",
        },
      ],
      profit: 1,
      result: {
        allQuantity: "0.0294128774074015",
        // price: '194.230769230769'
        price: "194.23076923076892",
      },
    },
    {
      priceQuantity: [
        {
          quantity: "0.0294128774074015",
          price: "192.307692307692",
        },
        {
          quantity: "0.04503846853008350",
          price: "184.6153846153850",
        },
        {
          quantity: "0.06908509433658030",
          price: "176.923076923077",
        },
        {
          quantity: "0.10617122906908100",
          price: "169.230769230769",
        },
        {
          quantity: "0.163503692766384",
          price: "161.538461538462",
        },
      ],
      profit: 1,
      result: {
        // allCount: '0.413211362109531'

        allQuantity: "0.4132113621095303",
        // price: '172.500514010154'
        price: "172.50051401015371742401",
      },
    },
  ];

  test.each(sellLongCalculationData)(
    "sellLongCalculationData work correct with %s",
    (data) => {
      const { priceQuantity, profit, result } = data;
      const allQuantityPrice = sellLongCalculation({ priceQuantity, profit });

      expect(allQuantityPrice.allQuantity.toString()).toBe(
        result.allQuantity.toString()
      );
      expect(String(allQuantityPrice.price)).toBe(result.price.toString());
    }
  );

  const getIndentData = [
    {
      volumeByPrice: 13,
      orderCount: 13,
      result: "1",
    },
    {
      volumeByPrice: 0.00115,
      orderCount: 5,
      result: "0.00023",
    },
    {
      volumeByPrice: 0.00000002,
      orderCount: 2,
      result: "1e-8",
    },
  ];
  test.each(getIndentData)("getIndent work correct with %s", (data) => {
    const { volumeByPrice, orderCount, result } = data;
    const indent = getIndent(new Big(volumeByPrice), orderCount);

    expect(indent.toString()).toBe(result);
  });

  const getMartingaleCoefficientFromPercentData = [
    {
      percentMartingale: 5,
      result: "1.05",
    },
    {
      percentMartingale: 15,
      result: "1.15",
    },
    {
      percentMartingale: 2,
      result: "1.02",
    },
  ];

  test.each(getMartingaleCoefficientFromPercentData)(
    "getMartingaleCoefficientFromPercent work correct with %s",
    (data) => {
      const { percentMartingale, result } = data;
      const martingaleCoefficient =
        getMartingaleCoefficientFromPercent(percentMartingale);

      expect(martingaleCoefficient.toString()).toBe(result);
    }
  );
});

describe("General trading formulas", () => {
  const getPriceWithIndentData = [
    {
      tradingAlgorithm: "LONG",
      price: 250,
      indent: 10.42,
      result: "239.58",
    },
    {
      tradingAlgorithm: "LONG",
      price: 1,
      indent: 0.04,
      result: "0.96",
    },
    {
      tradingAlgorithm: "LONG",
      price: 954,
      indent: 39.75,
      result: "914.25",
    },
    {
      tradingAlgorithm: "SHORT",
      price: 823,
      indent: 34.29,
      result: "857.29",
    },
    {
      tradingAlgorithm: "SHORT",
      price: 247,
      indent: 10.29,
      result: "257.29",
    },
    {
      tradingAlgorithm: "SHORT",
      price: 555,
      indent: 23.13,
      result: "578.13",
    },
  ];
  test.each(getPriceWithIndentData)(
    "getPriceWithIndent work correct with %s",
    (data) => {
      const { tradingAlgorithm, price, indent, result } = data;
      const resultPrice = getPriceWithIndent(
        tradingAlgorithm as TradingAlgorithm,
        new Big(price),
        new Big(indent)
      );

      expect(resultPrice.toString()).toBe(result);
    }
  );

  const getCountFromMartingaleData = [
    {
      prevCount: 1.12616242,
      martingaleCoefficient: 1.02,
      result: "1.1486856684",
    },
    {
      prevCount: 1.1449,
      martingaleCoefficient: 1.07,
      result: "1.225043",
    },
    {
      prevCount: 4.48403344,
      martingaleCoefficient: 1.35,
      result: "6.053445144",
    },
    {
      prevCount: 4.66948881,
      martingaleCoefficient: 1.47,
      result: "6.8641485507",
    },
  ];
  test.each(getCountFromMartingaleData)(
    "getCountFromMartingale work correct with %s",
    (data) => {
      const { prevCount, martingaleCoefficient, result } = data;
      const count = getCountFromMartingale(
        new Big(prevCount),
        martingaleCoefficient
      );

      expect(count.toString()).toBe(result);
    }
  );

  const getCountFromMartingaleBysequenceIndexInSideData = [
    {
      startQuantityBuy: 1,
      martingaleCoefficient: 1.05,
      sequenceIndexInSide: 2,
      result: "1.1025",
    },
    {
      startQuantityBuy: 6,
      martingaleCoefficient: 1.07,
      sequenceIndexInSide: 8,
      result: "10.3091170789915206",
    },
    {
      startQuantityBuy: 1,
      martingaleCoefficient: 1.12,
      sequenceIndexInSide: 4,
      result: "1.57351936",
    },
  ];
  test.each(getCountFromMartingaleBysequenceIndexInSideData)(
    "getCountFromMartingaleBysequenceIndexInSide work correct with %s",
    (data) => {
      const {
        startQuantityBuy,
        martingaleCoefficient,
        sequenceIndexInSide,
        result,
      } = data;
      const count = getCountFromMartingaleBysequenceIndexInSide(
        startQuantityBuy,
        martingaleCoefficient,
        sequenceIndexInSide
      );

      expect(count.toString()).toBe(result);
    }
  );

  test("All data", () => {
    const allData = getAllCount(1, 10, 1.05);

    expect(allData.toString()).toBe("12.577892535548828125");
  });

  const getCorrectionData = [
    {
      allCount: 98.12028793,
      deposit: "555",
      result: "5.65632257822095447249",
    },
    {
      allCount: 30.11280911,
      deposit: "333",
      result: "11.05841699402982068716",
    },
    {
      allCount: 49.45074145,
      deposit: "0.000005",
      result: "1.0111071853302e-7",
    },
  ];
  test.each(getCorrectionData)("getCorrection work correct with %s", (data) => {
    const { allCount, deposit, result } = data;
    const correction = getCorrection(new Big(allCount), deposit);

    expect(correction.toString()).toBe(result);
  });
});

describe("Long trading formulas", () => {
  const getSumWithCorrectionData = [
    {
      count: 2.28886641,
      correction: 33.20845944,
      result: "76.0097273400634104",
    },
    {
      count: 1.860867,
      correction: 28.3268159,
      result: "52.7124369233853",
    },
    {
      count: 2.81530568,
      correction: 11.05841699,
      result: "31.1328241637555032",
    },
  ];
  test.each(getSumWithCorrectionData)(
    "getSumWithCorrection work correct with %s",
    (data) => {
      const { count, correction, result } = data;
      const sum = getSumWithCorrection(new Big(count), new Big(correction));

      expect(sum.toString()).toBe(result);
    }
  );

  const getCountWithSumCorrectionLongData = [
    {
      price: 96.15384615,
      sumWithCorrection: 33.20845944,
      result: "0.34536797818981471913",
    },
    {
      price: 80.76923077,
      sumWithCorrection: 76.00972734,
      result: "0.94107281467675168748",
    },
    {
      price: 88.46153846,
      sumWithCorrection: 50.24107828,
      result: "0.56794262404465987172",
    },
  ];
  test.each(getCountWithSumCorrectionLongData)(
    "getCountWithSumCorrectionLong work correct with %s",
    (data) => {
      const { price, sumWithCorrection, result } = data;
      const count = getCountWithSumCorrectionLong(
        new Big(price),
        new Big(sumWithCorrection)
      );

      expect(count.toString()).toBe(result);
    }
  );

  const longCalculationData = [
    {
      countOrders: 10,
      deposit: "1000",
      martingale: 5,
      overlap: 50,
      currencyPrice: "100",
      tradingAlgorithm: "LONG" as TradingAlgorithm,
      sequenceIndexInSide: 5,
      result: {
        quantity: "1.44957461661159221227",
        priceWithIntent: "70",
      },
    },
    {
      countOrders: 10,
      deposit: "1000",
      martingale: 5,
      overlap: 50,
      currencyPrice: "100",
      tradingAlgorithm: "LONG" as TradingAlgorithm,
      sequenceIndexInSide: 0,
      result: {
        quantity: "0.83689026279428100526",
        priceWithIntent: "95",
      },
    },
    {
      countOrders: 5,
      deposit: "1000",
      martingale: 5,
      overlap: 50,
      currencyPrice: "18891.78",
      tradingAlgorithm: "LONG" as TradingAlgorithm,
      sequenceIndexInSide: 0,
      result: {
        quantity: "0.01064394721044862136",
        priceWithIntent: "17002.602",
      },
    },
    {
      countOrders: 3,
      deposit: "40",
      martingale: 1,
      overlap: 3,
      currencyPrice: "131",
      tradingAlgorithm: "LONG" as TradingAlgorithm,
      sequenceIndexInSide: 0,
      result: {
        quantity: "0.10178799027880924002",
        priceWithIntent: "129.69",
      },
    },
  ] as const;

  test.each(longCalculationData)(
    "longCalculation work correct with %s",
    ({ result, ...data }) => {
      const longData = longCalculation(data);

      expect({
        quantity: longData.quantity.toString(),
        priceWithIntent: longData.priceWithIntent.toString(),
      }).toEqual(result);
    }
  );

  test("longCalculation work correct with 10 elements", () => {
    const data = longCalculationData[0];
    const result: { priceWithIntent: Big.Big; quantity: Big.Big }[] = [];
    for (let i = 0; i < data.countOrders; i++) {
      result.push(longCalculation({ ...data, sequenceIndexInSide: i }));
    }

    const sum = result.reduce(
      (acc, item) =>
        (acc = acc.plus(
          new Big(Number(item.quantity)).times(Number(item.priceWithIntent))
        )),
      new Big(0)
    );

    expect(String(sum.toNumber())).toBe(data.deposit);
    expect(result).toMatchSnapshot();
  });
});

describe("Short trading formulas", () => {
  const getCountWithCorrectionData = [
    {
      count: 2.1609,
      correction: 5.656322578,
      result: "12.2227474588002",
    },
    {
      count: 14.8327386,
      correction: 7.91885161,
      result: "117.458255943319146",
    },
    {
      count: 21.80412575,
      correction: 1.131264516,
      result: "24.666233763376887",
    },
  ];
  test.each(getCountWithCorrectionData)(
    "getCountWithSumCorrection work correct with %s",
    (data) => {
      const { count, correction, result } = data;
      const resultCount = getCountWithCorrection(
        new Big(count),
        new Big(correction)
      );

      expect(resultCount.toString()).toBe(result);
    }
  );

  const getSumWithCountCorrectionShortData = [
    {
      price: 126.92307692,
      count: 79.90357549,
      result: "10141.6076581002966908",
    },
    {
      price: 134.61538462,
      count: 172.6636363,
      result: "23243.181810412293706",
    },
    {
      price: 111.53846154,
      count: 17.11184644,
      result: "1908.6290260263259176",
    },
  ];
  test.each(getSumWithCountCorrectionShortData)(
    "getSumWithCountCorrectionShort work correct with %s",
    (data) => {
      const { count, price, result } = data;
      const sum = getSumWithCountCorrectionShort(
        new Big(price),
        new Big(count)
      );

      expect(sum.toString()).toBe(result);
    }
  );

  const shortCalculationData = [
    {
      countOrders: 10,
      deposit: "1000",
      martingale: 5,
      overlap: 50,
      currencyPrice: "100",
      tradingAlgorithm: "SHORT" as TradingAlgorithm,
      sequenceIndexInSide: 3,
      result: {
        quantity: "92.03648359438680712796755125",
        priceWithIntent: "120",
      },
    },
    {
      countOrders: 10,
      deposit: "1000",
      martingale: 5,
      overlap: 50,
      currencyPrice: "100",
      tradingAlgorithm: "SHORT" as TradingAlgorithm,
      sequenceIndexInSide: 0,
      result: {
        quantity: "79.50457496545669549981",
        priceWithIntent: "105",
      },
    },
  ] as const;

  test.each(shortCalculationData)(
    "shortCalculation work correct with %s",
    ({ result, ...data }) => {
      const shortData = shortCalculation(data);

      expect({
        quantity: shortData.quantity.toString(),
        priceWithIntent: shortData.priceWithIntent.toString(),
      }).toEqual(result);
    }
  );

  test("shortCalculationData work correct with 10 elements", () => {
    const data = shortCalculationData[0];
    const result: { priceWithIntent: Big.Big; quantity: Big.Big }[] = [];
    for (let i = 0; i < data.countOrders; i++) {
      result.push(shortCalculation({ ...data, sequenceIndexInSide: i }));
    }

    const sum = result.reduce(
      (acc, item) => acc.plus(new Big(item.quantity)),
      new Big(0)
    );

    expect(String(sum.toNumber())).toBe(data.deposit);
    expect(result).toMatchSnapshot();
  });
});

describe("Additional", () => {
  const stopLossPriceCalculationData = [
    {
      overlap: 50,
      stopLoss: 5,
      realtimePrice: "100",
      result: "45",
    },
    {
      overlap: 78,
      stopLoss: 20,
      realtimePrice: "24600",
      result: "492",
    },
  ];

  test.each(stopLossPriceCalculationData)(
    "stopLossPriceCalculation work correct with %s",
    (data) => {
      const { overlap, stopLoss, realtimePrice, result } = data;

      const correction = stopLimitPriceCalculation(
        overlap,
        stopLoss,
        realtimePrice
      );

      expect(correction.toString()).toBe(result);
    }
  );
});

// describe("countLongProfit", () => {
//   test("Should calculate profit correctly when there are buy and sell orders", () => {
//     const params = {
//       doneSellOrder: {
//         price: "10",
//         quantity: "5",
//         status: "done",
//       } as const,
//       doneBuyOrders: [
//         {
//           price: "8",
//           quantity: "3",
//           status: "done",
//         } as const,
//         {
//           price: "9",
//           quantity: "2",
//           status: "done",
//         } as const,
//       ],
//     };

//     expect(countLongProfit(params)).toBe("8");
//   });

//   test("Should return 0 profit when there are no buy orders", () => {
//     const params = {
//       doneSellOrder: {
//         price: "10",
//         quantity: "5",
//         status: "done",
//       } as const,
//       doneBuyOrders: [],
//     };

//     expect(countLongProfit(params)).toBe("0");
//   });

//   test("Should return negative profit when sell price is lower than buy price", () => {
//     const params = {
//       doneSellOrder: {
//         price: "8",
//         quantity: "5",
//         status: "done",
//       } as const,
//       doneBuyOrders: [
//         {
//           price: "10",
//           quantity: "3",
//           status: "done",
//         } as const,
//         {
//           price: "9",
//           quantity: "2",
//           status: "done",
//         } as const,
//       ],
//     };

//     expect(countLongProfit(params)).toBe("-8");
//   });

//   test("Should return profit when there are multiple buy orders", () => {
//     const params = {
//       doneSellOrder: {
//         price: "10",
//         quantity: "5",
//         status: "done",
//       } as const,
//       doneBuyOrders: [
//         {
//           price: "8",
//           quantity: "3",
//           status: "done",
//         } as const,
//         {
//           price: "9",
//           quantity: "2",
//           status: "done",
//         } as const,
//         {
//           price: "11",
//           quantity: "1",
//           status: "done",
//         } as const,
//       ],
//     };

//     expect(countLongProfit(params)).toBe("-3");
//   });
// });

// describe("countShortProfit", () => {
//   test("Should return profit of 0 when there are no sell orders", () => {
//     const params = {
//       doneSellOrders: [],
//     };

//     expect(countShortProfit(params)).toBe("0");
//   });

//   test("Should calculate profit correctly when there is one sell order", () => {
//     const params = {
//       doneSellOrders: [
//         {
//           price: "10",
//           quantity: "5",
//           status: "done",
//         } as const,
//       ],
//     };

//     expect(countShortProfit(params)).toBe("50");
//   });

//   test("Should calculate profit correctly when there are multiple sell orders", () => {
//     const params = {
//       doneSellOrders: [
//         {
//           price: "10",
//           quantity: "5",
//           status: "done",
//         } as const,
//         {
//           price: "8",
//           quantity: "3",
//           status: "done",
//         } as const,
//         {
//           price: "12",
//           quantity: "2",
//           status: "done",
//         } as const,
//       ],
//     };

//     expect(countShortProfit(params)).toBe("98");
//   });

//   test("Should handle negative profit correctly", () => {
//     const params = {
//       doneSellOrders: [
//         {
//           price: "8",
//           quantity: "5",
//           status: "done",
//         } as const,
//         {
//           price: "7",
//           quantity: "3",
//           status: "done",
//         } as const,
//       ],
//     };

//     expect(countShortProfit(params)).toBe("61");
//   });

//   test("Should handle decimal values correctly", () => {
//     const params = {
//       doneSellOrders: [
//         {
//           price: "1.5",
//           quantity: "2",
//           status: "done",
//         } as const,
//         {
//           price: "2.5",
//           quantity: "3",
//           status: "done",
//         } as const,
//       ],
//     };

//     expect(countShortProfit(params)).toBe("10.5"); // Expected profit = (1.5 * 2) + (2.5 * 3) = 3 + 7.5 = 10.5
//   });
// });
