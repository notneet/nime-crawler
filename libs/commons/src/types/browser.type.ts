import { Data } from '@entities/types/pattern-data.type';

export interface IBrowserRequest extends Data {
  url: string;
  wait_for_selector: string;
  max_scrolls: number;
  options: Option[];
}

export interface Option {
  click_element: string;
  close_new_page: boolean;
}

export interface IBrowserResponse {
  message: string;
  statusCode: number;
  error: null;
  data: DataBrowserResponse;
}

export interface DataBrowserResponse {
  html: string;
}
