import * as libxmljs from 'libxmljs2';
import {
  AnimeBatchLinks,
  ParsedPattern,
} from '../html-scraper/html-scraper.service';

export const animeExtractor = () => {
  return;
};

export const extractProviderWithLink = (
  component: libxmljs.Element,
  parsedPattern?: ParsedPattern[],
): AnimeBatchLinks[] => {
  console.log(component.toString(), 'ookok');
  const providerName = component.find('//li/a/text()[normalize-space()]');
  console.log(providerName?.toString());

  return [];
};
