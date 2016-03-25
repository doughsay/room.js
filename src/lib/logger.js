import winston from 'winston';

winston.loggers.add('mongo', {
  console: {
    level: 'silly',
    label: 'mongo',
    colorize: true,
    timestamp: true,
  },
});

export const mongoLogger = winston.loggers.get('mongo');

winston.loggers.add('socket', {
  console: {
    level: 'silly',
    label: 'socket',
    colorize: true,
    timestamp: true,
  },
});

export const socketLogger = winston.loggers.get('socket');

winston.loggers.add('server', {
  console: {
    level: 'silly',
    label: 'server',
    colorize: true,
    timestamp: true,
  },
});

export const serverLogger = winston.loggers.get('server');

winston.loggers.add('vm', {
  console: {
    level: 'silly',
    label: 'vm',
    colorize: true,
    timestamp: true,
  },
});

export const vmLogger = winston.loggers.get('vm');

winston.loggers.add('cron', {
  console: {
    level: 'silly',
    label: 'cron',
    colorize: true,
    timestamp: true,
  },
});

export const cronLogger = winston.loggers.get('cron');
