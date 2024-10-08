// Тесты для функции getNextSequenceIndexByRules

import { describe, test, expect, ArgumentsType } from "vitest";
import { getNextSequenceIndexByRules } from ".";
import { Order } from "../entities/order/order";
import { Side } from "../types";

describe("getNextSequenceIndexByRules", () => {
  test("should return 0 when orders are empty", () => {
    const orders: Order[] = [];
    const side: Side = "BUY";

    expect(getNextSequenceIndexByRules(orders, side)).toBe(0);
  });

  test("should return the next index for long (only BUY orders, side=BUY)", () => {
    const orders: ArgumentsType<typeof getNextSequenceIndexByRules>[0] = [
      { side: "BUY", sequenceIndexInSide: 1, status: "active" },
      { side: "BUY", sequenceIndexInSide: 2, status: "active" },
    ];
    const side: Side = "BUY";

    expect(getNextSequenceIndexByRules(orders, side)).toBe(3);
  });

  test("should return the current index for long (only BUY orders, side=SELL with done status)", () => {
    const orders: ArgumentsType<typeof getNextSequenceIndexByRules>[0] = [
      { side: "BUY", sequenceIndexInSide: 1, status: "done" },
      { side: "BUY", sequenceIndexInSide: 2, status: "done" },
    ];
    const side: Side = "SELL";

    expect(getNextSequenceIndexByRules(orders, side)).toBe(2);
  });

  test("should return the next index for long (mixed BUY and SELL orders, side=BUY)", () => {
    const orders: ArgumentsType<typeof getNextSequenceIndexByRules>[0] = [
      { side: "BUY", sequenceIndexInSide: 1, status: "done" },
      { side: "SELL", sequenceIndexInSide: 1, status: "active" },
    ];
    const side: Side = "BUY";

    expect(getNextSequenceIndexByRules(orders, side)).toBe(2);
  });

  test("should return the current index for long (mixed BUY and SELL orders, side=SELL with done status)", () => {
    const orders: ArgumentsType<typeof getNextSequenceIndexByRules>[0] = [
      { side: "BUY", sequenceIndexInSide: 1, status: "done" },
      { side: "SELL", sequenceIndexInSide: 2, status: "active" },
    ];
    const side: Side = "SELL";

    expect(() => getNextSequenceIndexByRules(orders, side)).toThrow(
      "There are more sell orders than buy orders"
    );
  });

  test("should return the next index for short (only SELL orders, side=SELL)", () => {
    const orders: ArgumentsType<typeof getNextSequenceIndexByRules>[0] = [
      { side: "SELL", sequenceIndexInSide: 1, status: "active" },
      { side: "SELL", sequenceIndexInSide: 2, status: "active" },
    ];
    const side: Side = "SELL";

    expect(getNextSequenceIndexByRules(orders, side)).toBe(3);
  });

  test("should throw error for short (only SELL orders, side=BUY)", () => {
    const orders: ArgumentsType<typeof getNextSequenceIndexByRules>[0] = [
      { side: "SELL", sequenceIndexInSide: 1, status: "active" },
      { side: "SELL", sequenceIndexInSide: 2, status: "active" },
    ];
    const side: Side = "BUY";

    expect(() => getNextSequenceIndexByRules(orders, side)).toThrow(
      'Invalid order configuration: all orders are "sell", but side is "buy".'
    );
  });
});
