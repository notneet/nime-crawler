// Ref: cleaner-type.ts

export interface Pipe {
  id: number;
  type: string;
  has_regex: boolean; // from
  has_to: boolean;
  has_scope: boolean; // 'g' | 'm' | 'gm' | 'mg'; // global or multiline
}

export const RegisteredPipes: Pipe[] = [
  {
    id: 1,
    type: 'regex-extraction',
    has_regex: true,
    has_to: false,
    has_scope: true,
  },
  {
    id: 2,
    type: 'regex-replace',
    has_regex: true,
    has_to: true,
    has_scope: true,
  },
  {
    id: 3,
    type: 'num-normalize',
    has_regex: false,
    has_to: false,
    has_scope: false,
  },
  {
    id: 4,
    type: 'date-format',
    has_regex: false,
    has_to: false,
    has_scope: false,
  },
  {
    id: 5,
    type: 'month-id-translator',
    has_regex: false,
    has_to: false,
    has_scope: false,
  },
  {
    id: 6,
    type: 'query-remover',
    has_regex: true,
    has_to: false,
    has_scope: false,
  },
  {
    id: 7,
    type: 'parse-as-url',
    has_regex: false,
    has_to: false,
    has_scope: false,
  },
];
