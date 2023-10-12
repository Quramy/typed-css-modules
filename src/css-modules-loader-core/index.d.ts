import type { Plugin } from 'postcss';

type Source =
  | string
  | {
      toString(): string;
    };

type PathFetcher = (file: string, relativeTo: string, depTrace: string) => void;

export interface ExportTokens {
  readonly [index: string]: string;
}

export interface Result {
  readonly injectableSource: string;
  readonly exportTokens: ExportTokens;
}

export default class Core {
  constructor(plugins?: Plugin[]);

  load(source: Source, sourcePath?: string, trace?: string, pathFetcher?: PathFetcher): Promise<Result>;
}
