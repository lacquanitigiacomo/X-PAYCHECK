import { loadServerConfig } from '@x-paycheck/shared';
import { createApp } from './app';
import { setupLogger } from './utils/logger';

const config = loadServerConfig(process.env);
const logger = setupLogger();

createApp(process.env).listen(config.port, () => {
  logger.info(`X-PAY CHECK API running on http://localhost:${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});
