import Big from "big.js";
import { Coefficient, Percent, Side, TradingAlgorithm } from "../types";

/**
 * @example 50
 * @description Value it is Currency, 50$ or 50€ and etc.
 *
 */
type RealCurrency = Big;
/**
 * @example 50
 * @description Value it is Currency, 50 BTC or 50 ETH and etc.
 *
 */
type CriptoCurrency = Big;

/**
 * @description 100%
 */
const HUNDRED_PERCENT: Percent = 100;

export type ShortCalculationPayload = {
  countOrders: number;
  overlap: Percent;
  currencyPrice: RealCurrency | string;
  deposit: string;
  martingale: Percent;
  tradingAlgorithm: TradingAlgorithm;
  sequenceIndexInSide: number;
};

export type LongCalculationPayload = {
  countOrders: number;
  overlap: Percent;
  currencyPrice: RealCurrency | string;
  deposit: string;
  martingale: Percent;
  tradingAlgorithm: TradingAlgorithm;
  sequenceIndexInSide: number;
};

export const getProfitPercent = (profit: number): Percent =>
  (HUNDRED_PERCENT + profit) / HUNDRED_PERCENT;

// Base operation
export const getVolumeByPrice = (
  price: RealCurrency,
  overlap: Percent
): RealCurrency => new Big(price).times(new Big(overlap)).div(HUNDRED_PERCENT);

export const getIndent = (
  volumeByPrice: RealCurrency,
  orderCount: number
): RealCurrency => new Big(volumeByPrice).div(new Big(orderCount));

export const getMartingaleCoefficientFromPercent = (
  percentMartingaleCoefficient: Percent
): Coefficient =>
  new Big(HUNDRED_PERCENT)
    .plus(new Big(percentMartingaleCoefficient))
    .div(new Big(HUNDRED_PERCENT))
    .toString();

//General
export const getPriceWithIndent = (
  tradingAlgorithm: TradingAlgorithm,
  price: RealCurrency,
  indent: RealCurrency
) =>
  tradingAlgorithm === "LONG"
    ? new Big(price).minus(new Big(indent))
    : new Big(price).plus(new Big(indent));

export const getCountFromMartingale = (
  prevCount: string | number | Big,
  martingale: Coefficient | string | number | Big
) => new Big(prevCount).times(new Big(martingale));

export const getCountFromMartingaleBysequenceIndexInSide = (
  startQuantityBuy: number,
  martingale: Coefficient | string | number | Big,
  sequenceIndexInSide: number
) =>
  new Big(startQuantityBuy).times(new Big(martingale).pow(sequenceIndexInSide));

export const getAllCount = (
  startCount: number,
  countOrders: number,
  martingale: Coefficient | string | number | Big
): Big => {
  let sum = new Big(0);
  let prev = new Big(startCount);
  for (let i = 0; i < countOrders; i++) {
    prev = sum.eq(new Big(0))
      ? new Big(startCount)
      : getCountFromMartingale(prev, martingale);
    sum = sum.plus(prev);
  }

  return sum;
};

export const getCorrection = (
  allCount: Big,
  deposit: RealCurrency | string
): Big => new Big(deposit).div(new Big(allCount));

// Long
export const getSumWithCorrection = (count: Big, correction: Big): Big =>
  new Big(count).times(new Big(correction));

export const getCountWithSumCorrectionLong = (
  price: RealCurrency,
  sumWithCorrection: Big
): Big => new Big(sumWithCorrection).div(new Big(price));

//Short
export const getCountWithCorrection = (
  count: Big,
  correction: Big
): CriptoCurrency => new Big(count).times(new Big(correction));

export const getSumWithCountCorrectionShort = (
  price: RealCurrency,
  count: CriptoCurrency
): RealCurrency => new Big(price).times(new Big(count));

export const longCalculation = (payload: LongCalculationPayload) => {
  const startQuantityBuy = 1;

  const martingaleCoefficient = getMartingaleCoefficientFromPercent(
    payload.martingale
  );

  const volumeByPrice = getVolumeByPrice(
    new Big(payload.currencyPrice),
    payload.overlap
  );

  const indent = getIndent(volumeByPrice, payload.countOrders).times(
    payload.sequenceIndexInSide + 1
  );

  const priceWithIntent = getPriceWithIndent(
    payload.tradingAlgorithm,
    new Big(payload.currencyPrice),
    indent
  );

  const countFromMartingale = getCountFromMartingaleBysequenceIndexInSide(
    startQuantityBuy,
    martingaleCoefficient,
    payload.sequenceIndexInSide
  );

  const allCount = getAllCount(
    startQuantityBuy,
    payload.countOrders,
    martingaleCoefficient
  );

  const correction = getCorrection(allCount, payload.deposit);
  const priceWithCorrection = getSumWithCorrection(
    countFromMartingale,
    correction
  );

  const countWithSumCorrection = getCountWithSumCorrectionLong(
    priceWithIntent,
    priceWithCorrection
  );

  return {
    priceWithIntent,
    quantity: countWithSumCorrection,
  };
};

export const shortCalculation = (payload: ShortCalculationPayload) => {
  const startQuantityBuy = 1;

  const bigPrice = new Big(payload.currencyPrice);

  const volumeByPrice = getVolumeByPrice(bigPrice, payload.overlap);

  const indent = getIndent(volumeByPrice, payload.countOrders).times(
    payload.sequenceIndexInSide + 1
  );

  const priceWithIntent = getPriceWithIndent(
    payload.tradingAlgorithm,
    bigPrice,
    indent
  );

  const martingaleCoefficient = getMartingaleCoefficientFromPercent(
    payload.martingale
  );

  const countFromMartingale = getCountFromMartingaleBysequenceIndexInSide(
    startQuantityBuy,
    martingaleCoefficient,
    payload.sequenceIndexInSide
  );

  const allCount = getAllCount(
    startQuantityBuy,
    payload.countOrders,
    martingaleCoefficient
  );
  const correction = getCorrection(allCount, payload.deposit);

  const countWithSumCorrection = getCountWithCorrection(
    countFromMartingale,
    correction
  );

  return {
    priceWithIntent,
    quantity: countWithSumCorrection,
  };
};

export const sellLongCalculation = ({
  priceQuantity,
  profit,
}: {
  priceQuantity: { price: string; quantity: string }[];
  profit: Percent;
}): { price: string; allQuantity: string } => {
  const { allQuantity, allSum } = priceQuantity.reduce(
    (acc, { price: inputPrice, quantity: inputCount }) => {
      acc.allQuantity = new Big(acc.allQuantity).plus(new Big(inputCount));
      acc.allSum = new Big(acc.allSum).plus(
        new Big(inputPrice).times(new Big(inputCount))
      );

      return acc;
    },
    {
      allQuantity: new Big(0),
      allSum: new Big(0),
    }
  );

  const percentProfit = getProfitPercent(profit);

  const sumProfit = allSum.times(new Big(percentProfit));

  const price = sumProfit.div(allQuantity);

  return { price: price.toString(), allQuantity: allQuantity.toString() };
};

export const stopLimitPriceCalculation = (
  overlap: Percent,
  stopLoss: Percent,
  realtimePrice: string
) => {
  const stopLossOverlap = overlap + stopLoss;

  const priceStopLoss = new Big(realtimePrice)
    .times(HUNDRED_PERCENT - stopLossOverlap)
    .div(HUNDRED_PERCENT);

  return priceStopLoss.toString();
};
