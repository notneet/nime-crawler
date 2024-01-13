class MonthIDTranslator {
  constructor() {
    this.indonesianMonths = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    this.englishMonths = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
  }

  exec(val) {
    this.indonesianMonths.forEach((it, i) => {
      const month = val.match(new RegExp(/\b[a-zA-Z]+\b/, 'g'));
      if (it.includes(month.shift())) {
        val = val.replace(
          new RegExp(/\b[a-zA-Z]+\b/, 'g'),
          this.englishMonths[i],
        );
      }
    });

    return val;
  }
}

// Example usage
const translator = new MonthIDTranslator();
console.log(translator.exec('10 Januari 2015'));
console.log(translator.exec('Okt 10, 2021'));
console.log(translator.exec('Dec 3, 2024'));
