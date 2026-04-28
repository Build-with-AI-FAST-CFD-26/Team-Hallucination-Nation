import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { formatErrorResponse } from '../utils/formatters';

export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error in ghost-recruiter:', err);

  let status = HTTP_STATUS.INTERNAL_ERROR;
  let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred during evaluation';

  if (err.status) {
    status = err.status;
  }

  if (err.code) {
    errorCode = err.code;
  }

  if (err.message) {
    message = err.message;
  }

  res.status(status).json(formatErrorResponse(errorCode, message, status));
}
