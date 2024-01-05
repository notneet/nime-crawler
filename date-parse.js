const { parseDate } = require('chrono-node');
const { DateTime } = require('luxon');

class DateFormatPipe {
  type;
  format;

  constructor(format) {
    this.format = format;
  }

  exec(val) {
    console.log(val);
    // Parse the input string using chrono-node
    const parsedDate = parseDate(val);

    if (!parsedDate) {
      console.error('Invalid date format');
      return null;
    }
    const luxonDate = DateTime.fromJSDate(parsedDate, {
      zone: String(val).toLocaleLowerCase().endsWith('z') ? 'utc' : undefined,
    });
    const formattedDate = luxonDate.toFormat('yyyy-MM-dd HH:mm:ss');

    // You can then use formattedDate and unixTimestamp as needed
    console.log('Formatted Date:', formattedDate);
    console.log('Unix Timestamp:', luxonDate.toSeconds());

    return formattedDate; // Or return any other result as needed
  }
}

console.time('first');
new DateFormatPipe('').exec('Jul 8, 2014');
console.timeEnd('first');

console.time('second');
new DateFormatPipe('').exec('10-10-2023 20:37');
console.timeEnd('second');

console.time('third');
new DateFormatPipe('').exec('2 hours ago');
console.timeEnd('third');

console.time('fourth');
new DateFormatPipe('').exec('2023-12-30T00:57:35.177Z');
console.timeEnd('fourth');
