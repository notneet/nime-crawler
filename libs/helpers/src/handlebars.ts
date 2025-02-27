import { NestExpressApplication } from '@nestjs/platform-express';
import * as hbs from 'hbs';
import { DateTime } from 'luxon';
import { resolve } from 'path';

export const handlebarsHelpers = {
  // Convert any data to JSON string, handling BigInt
  json: (context: any) => {
    return JSON.stringify(context, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    );
  },

  // Format date using Luxon
  formatDate: (date: Date) => {
    return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd HH:mm:ss');
  },

  // Helper for truncating URLs
  truncateUrl: (url: string) => {
    const maxLength = 50;
    return url?.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  },

  // Helper for conditional equality comparison
  eq: (a: any, b: any) => {
    return a === b;
  },

  // Helper for conditional checks
  isNull: (value: any) => {
    return value === null || value === undefined;
  },
};

export function configureHandlebars(app: NestExpressApplication) {
  // Set base views directory for templates
  app.setBaseViewsDir(resolve('views'));

  // Register partials directory
  hbs.registerPartials(resolve('views/partials'));

  // Register all helpers
  Object.entries(handlebarsHelpers).forEach(([helperName, helperFn]) => {
    hbs.registerHelper(helperName, helperFn);
  });

  // Set Handlebars as the view engine
  app.setViewEngine('hbs');
}
