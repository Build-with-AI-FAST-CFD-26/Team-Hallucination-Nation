import { Request, Response, NextFunction } from 'express';
import { validateEvaluationRequest } from '../utils/validators';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { formatErrorResponse } from '../utils/formatters';

export function validateEvaluationRequestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validateEvaluationRequest(req.body);

  if (errors.length > 0) {
    const firstError = errors[0];
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        firstError.message,
        HTTP_STATUS.BAD_REQUEST,
        { field: firstError.field, constraint: firstError.constraint }
      )
    );
  }

  next();
}
