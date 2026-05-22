import { Stage } from './exchanges';

export class ParsedResultDto {
  source!: string;
  stage!: Stage;
  url!: string;
  data!: Record<string, unknown>;
}
