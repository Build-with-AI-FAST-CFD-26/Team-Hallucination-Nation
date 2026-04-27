import { ghostRecruiterRouter } from './routes/recruiter.routes';

export { ghostRecruiterRouter };
export * from './types';

/**
 * Ghost Recruiter Module
 * Isolated backend service for CV evaluation against job descriptions
 *
 * Usage in main server:
 * ```
 * import { ghostRecruiterRouter } from './ghost-recruiter';
 * app.use('/api/ghost-recruiter', ghostRecruiterRouter);
 * ```
 */
