import { ValidationError } from '../types/request.types';
import { INPUT_CONSTRAINTS } from '../config/constants';

export function validateEvaluationRequest(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.cv_text) {
    errors.push({
      field: 'cv_text',
      message: 'CV text is required',
      constraint: 'required',
      expected: 'string',
      received: typeof data.cv_text
    });
  } else if (typeof data.cv_text !== 'string') {
    errors.push({
      field: 'cv_text',
      message: 'CV text must be a string',
      constraint: 'type',
      expected: 'string',
      received: typeof data.cv_text
    });
  } else if (data.cv_text.length < INPUT_CONSTRAINTS.CV_TEXT.min) {
    errors.push({
      field: 'cv_text',
      message: `CV text must be at least ${INPUT_CONSTRAINTS.CV_TEXT.min} characters`,
      constraint: 'minLength',
      expected: INPUT_CONSTRAINTS.CV_TEXT.min,
      received: data.cv_text.length
    });
  } else if (data.cv_text.length > INPUT_CONSTRAINTS.CV_TEXT.max) {
    errors.push({
      field: 'cv_text',
      message: `CV text must not exceed ${INPUT_CONSTRAINTS.CV_TEXT.max} characters`,
      constraint: 'maxLength',
      expected: INPUT_CONSTRAINTS.CV_TEXT.max,
      received: data.cv_text.length
    });
  }

  if (!data.job_description) {
    errors.push({
      field: 'job_description',
      message: 'Job description is required',
      constraint: 'required',
      expected: 'string',
      received: typeof data.job_description
    });
  } else if (typeof data.job_description !== 'string') {
    errors.push({
      field: 'job_description',
      message: 'Job description must be a string',
      constraint: 'type',
      expected: 'string',
      received: typeof data.job_description
    });
  } else if (data.job_description.length < INPUT_CONSTRAINTS.JOB_DESCRIPTION.min) {
    errors.push({
      field: 'job_description',
      message: `Job description must be at least ${INPUT_CONSTRAINTS.JOB_DESCRIPTION.min} characters`,
      constraint: 'minLength',
      expected: INPUT_CONSTRAINTS.JOB_DESCRIPTION.min,
      received: data.job_description.length
    });
  } else if (data.job_description.length > INPUT_CONSTRAINTS.JOB_DESCRIPTION.max) {
    errors.push({
      field: 'job_description',
      message: `Job description must not exceed ${INPUT_CONSTRAINTS.JOB_DESCRIPTION.max} characters`,
      constraint: 'maxLength',
      expected: INPUT_CONSTRAINTS.JOB_DESCRIPTION.max,
      received: data.job_description.length
    });
  }

  if (data.role_title && data.role_title.length > INPUT_CONSTRAINTS.ROLE_TITLE.max) {
    errors.push({
      field: 'role_title',
      message: `Role title must not exceed ${INPUT_CONSTRAINTS.ROLE_TITLE.max} characters`,
      constraint: 'maxLength',
      expected: INPUT_CONSTRAINTS.ROLE_TITLE.max,
      received: data.role_title.length
    });
  }

  if (data.company_name && data.company_name.length > INPUT_CONSTRAINTS.COMPANY_NAME.max) {
    errors.push({
      field: 'company_name',
      message: `Company name must not exceed ${INPUT_CONSTRAINTS.COMPANY_NAME.max} characters`,
      constraint: 'maxLength',
      expected: INPUT_CONSTRAINTS.COMPANY_NAME.max,
      received: data.company_name.length
    });
  }

  return errors;
}

export function isValidJSON(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}
