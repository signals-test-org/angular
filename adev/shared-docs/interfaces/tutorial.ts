/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {FileSystemTree} from '@webcontainer/api';
import {NavigationItem} from './navigation-item';

/** the step is used only in this function to sort the nav items */
export type TutorialNavigationItemWithStep = TutorialNavigationItem & {
  tutorialData: TutorialNavigationData & {
    step: TutorialStep['step'];
  };
};

/**
 * Represents the contents of the tutorial files to be generated by the build script
 */
export type TutorialFiles = {
  sourceCode?: FileSystemTree;
  metadata?: TutorialMetadata;
  sourceCodeZip?: Uint8Array;
  route?: Omit<TutorialNavigationItemWithStep, 'path'>;
};

export type PlaygroundFiles = {
  sourceCode?: FileSystemTree;
  metadata?: TutorialMetadata;
  sourceCodeZip?: undefined;
  route?: PlaygroundRouteData;
};

/** Represents the contents of the tutorial config file */
export type TutorialMetadata = {
  type: TutorialConfig['type'];

  /** a record of all tutorials filenames and its contents */
  tutorialFiles: FileAndContentRecord;

  /** a record of filenames and contents for the tutorial answer */
  answerFiles?: FileAndContentRecord;

  /** files that are part of the project but are not visible in the code editor */
  hiddenFiles: string[];

  /**
   * All files in the project, used to find the difference between new and old projects
   * when changing projects
   */
  allFiles: string[];

  openFiles: NonNullable<TutorialConfig['openFiles']>;

  /** whether a package.json exists */
  dependencies?: Record<string, string>;
};

export type TutorialStep = {
  step: number;
  name: string;
  path: string;
  url: string;
  nextStep?: TutorialStep['url'];
  previousStep?: TutorialStep['url'];
  nextTutorial?: string;
};

export type TutorialConfig =
  | EditorTutorialConfig
  | LocalTutorialConfig
  | CliTutorialConfig
  | EditorOnlyTutorialConfig;

export interface TutorialConfigBase {
  type: TutorialType;

  /** The tutorial title */
  title: string;

  /** The name of the tutorial folder that will be started after the current one ends. */
  nextTutorial?: string;

  /** The path to the tutorial src folder when it's external to the tutorial */
  src?: string;

  /** The path to the tutorial answer folder when it's external to the tutorial */
  answerSrc?: string;

  /** An array of files to be open in the editor */
  openFiles?: string[];
}

/** Represents a tutorial config with all the embedded editor components enabled */
export interface EditorTutorialConfig extends TutorialConfigBase {
  type: TutorialType.EDITOR;
}

/** Represents a tutorial config that won't use the embedded editor */
export interface LocalTutorialConfig extends TutorialConfigBase {
  type: TutorialType.LOCAL;

  // fields that must be undefined for local app tutorials
  openFiles?: undefined;
  src?: undefined;
  answerSrc?: undefined;
}

/** Represents a tutorial config that supports only the interactive terminal for the Angular CLI */
export type CliTutorialConfig = Omit<LocalTutorialConfig, 'type'> & {
  type: TutorialType.CLI;
};

export type EditorOnlyTutorialConfig = Omit<EditorTutorialConfig, 'type'> & {
  type: TutorialType.EDITOR_ONLY;
};

export type FileAndContent = {
  path: string;
  content: string | Uint8Array;
};

export type FileAndContentRecord = Record<FileAndContent['path'], FileAndContent['content']>;

export type TutorialNavigationItem = {
  path: NonNullable<NavigationItem['path']>;
  label: NonNullable<NavigationItem['label']>;
  children?: TutorialNavigationItem[];
  parent?: TutorialNavigationItem;
  contentPath?: string;
  tutorialData: TutorialNavigationData;
};

export type TutorialNavigationData = {
  type: TutorialConfig['type'];
  title: TutorialConfig['title'];
  nextStep?: string;
  previousStep?: string;
  nextTutorial?: string;
  sourceCodeZipPath?: string;
};

export type PlaygroundRouteData = {
  templates: PlaygroundTemplate[];
  defaultTemplate?: PlaygroundTemplate;
  starterTemplate?: PlaygroundTemplate;
};

export type PlaygroundTemplate = Required<Pick<NavigationItem, 'path' | 'label'>>;

// Note: only the fields being used are defined in this type
export interface PackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export const enum TutorialType {
  CLI = 'cli',
  LOCAL = 'local',
  EDITOR = 'editor',
  EDITOR_ONLY = 'editor-only',
}
