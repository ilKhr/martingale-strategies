export interface SimpleError {
  error: string;
  message?: string;
}

export enum HTTP_STATUS {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  LEGALS_REASON = 451,
  INTERNAL_SERVER = 500,
}

// General code
export type BaseError = SimpleError & { code: HTTP_STATUS };

export const baseError = ({
  error,
  code = HTTP_STATUS.INTERNAL_SERVER,
  message,
}: BaseError): BaseError => ({ error, code, message } as BaseError);

// Result format
export type Result<SuccessValue, FailValue> =
  | { value: SuccessValue; isFail: false }
  | { value: FailValue; isFail: true };

export const failWrapper = <FailValue extends BaseError>(
  value: FailValue
): Result<never, FailValue> => ({ value, isFail: true });

export const successWrapper = <SuccessValue>(
  value: SuccessValue
): Result<SuccessValue, never> => ({ value, isFail: false });

// Ready-to-use functions for specific uses
export const badRequestError = (
  error: BaseError["error"],
  message: BaseError["message"] = undefined
) => baseError({ error, code: HTTP_STATUS.BAD_REQUEST, message });

export const notFoundError = (
  error: BaseError["error"],
  message: BaseError["message"] = undefined
) => baseError({ error, code: HTTP_STATUS.NOT_FOUND, message });

export const forbiddenError = (
  error: BaseError["error"],
  message: BaseError["message"] = undefined
) => baseError({ error, code: HTTP_STATUS.FORBIDDEN, message });
