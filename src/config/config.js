import dotenv from 'dotenv';

import { loadIntegerFromEnv } from './environment-config';
import * as pkg from '../../package.json';

dotenv.config();

export const env = process.env.NODE_ENV || 'development';
export const appName = pkg.name;
export const version = pkg.version;
export const port = loadIntegerFromEnv('PORT');
