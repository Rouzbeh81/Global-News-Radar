const GoogleNewsAdapter = require('./GoogleNewsAdapter');

const sources = [
  { name: 'BBC News', region: 'Europe', tag: 'BBC News' },
  { name: 'Reuters', region: 'Europe', tag: 'Reuters' },
  { name: 'The Guardian', region: 'Europe', tag: 'The Guardian' },
  { name: 'Al Jazeera', region: 'Middle East', tag: 'Al Jazeera' },
  { name: 'Deutsche Welle', region: 'Europe', tag: 'Deutsche Welle' },
  { name: 'France 24', region: 'Europe', tag: 'France 24' },
  { name: 'NPR', region: 'North America', tag: 'NPR' },
  { name: 'Associated Press', region: 'North America', tag: 'Associated Press' },
  { name: 'The New York Times', region: 'North America', tag: 'The New York Times' },
  { name: 'Voice of America', region: 'North America', tag: 'Voice of America' },
  { name: 'Radio Free Europe/Radio Liberty', region: 'Europe', tag: 'Radio Free Europe' },
  { name: 'Haaretz', region: 'Middle East', tag: 'Haaretz' },
  { name: 'The Jerusalem Post', region: 'Middle East', tag: 'The Jerusalem Post' },
  { name: 'Arab News', region: 'Middle East', tag: 'Arab News' },
  { name: 'Euronews', region: 'Europe', tag: 'Euronews' }
];

const adapters = sources.map(s => new GoogleNewsAdapter(s.name, s.region, s.tag));

module.exports = adapters;
