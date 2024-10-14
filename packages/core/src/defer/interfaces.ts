/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {Provider} from '../di/interface/provider';
import type {LContainer} from '../render3/interfaces/container';
import type {DependencyType} from '../render3/interfaces/definition';
import type {TNode} from '../render3/interfaces/node';
import type {LView} from '../render3/interfaces/view';

// TODO(incremental-hydration): This interface should be renamed to better
// reflect what it does. DeferBlock is to generic
/**
 * Basic set of data structures used for identifying a defer block
 * and triggering defer blocks
 */
export interface DeferBlock {
  lView: LView;
  tNode: TNode;
  lContainer: LContainer;
}

/**
 * Describes the shape of a function generated by the compiler
 * to download dependencies that can be defer-loaded.
 */
export type DependencyResolverFn = () => Array<Promise<DependencyType>>;

/**
 * Defines types of defer block triggers.
 */
export const enum TriggerType {
  /**
   * Represents regular triggers (e.g. `@defer (on idle) { ... }`).
   */
  Regular,

  /**
   * Represents prefetch triggers (e.g. `@defer (prefetch on idle) { ... }`).
   */
  Prefetch,

  /**
   * Represents hydrate triggers (e.g. `@defer (hydrate on idle) { ... }`).
   */
  Hydrate,
}

/**
 * Describes the state of defer block dependency loading.
 */
export enum DeferDependenciesLoadingState {
  /** Initial state, dependency loading is not yet triggered */
  NOT_STARTED,

  /** Dependency loading is in progress */
  IN_PROGRESS,

  /** Dependency loading has completed successfully */
  COMPLETE,

  /** Dependency loading has failed */
  FAILED,
}

/** Slot index where `minimum` parameter value is stored. */
export const MINIMUM_SLOT = 0;

/** Slot index where `after` parameter value is stored. */
export const LOADING_AFTER_SLOT = 1;

/** Configuration object for a loading block as it is stored in the component constants. */
export type DeferredLoadingBlockConfig = [minimumTime: number | null, afterTime: number | null];

/** Configuration object for a placeholder block as it is stored in the component constants. */
export type DeferredPlaceholderBlockConfig = [minimumTime: number | null];

/**
 * Describes the data shared across all instances of a defer block.
 */
export interface TDeferBlockDetails {
  /**
   * Index in an LView and TData arrays where a template for the primary content
   * can be found.
   */
  primaryTmplIndex: number;

  /**
   * Index in an LView and TData arrays where a template for the loading block can be found.
   */
  loadingTmplIndex: number | null;

  /**
   * Extra configuration parameters (such as `after` and `minimum`) for the loading block.
   */
  loadingBlockConfig: DeferredLoadingBlockConfig | null;

  /**
   * Index in an LView and TData arrays where a template for the placeholder block can be found.
   */
  placeholderTmplIndex: number | null;

  /**
   * Extra configuration parameters (such as `after` and `minimum`) for the placeholder block.
   */
  placeholderBlockConfig: DeferredPlaceholderBlockConfig | null;

  /**
   * Index in an LView and TData arrays where a template for the error block can be found.
   */
  errorTmplIndex: number | null;

  /**
   * Compiler-generated function that loads all dependencies for a defer block.
   */
  dependencyResolverFn: DependencyResolverFn | null;

  /**
   * Keeps track of the current loading state of defer block dependencies.
   */
  loadingState: DeferDependenciesLoadingState;

  /**
   * Dependency loading Promise. This Promise is helpful for cases when there
   * are multiple instances of a defer block (e.g. if it was used inside of an *ngFor),
   * which all await the same set of dependencies.
   */
  loadingPromise: Promise<unknown> | null;

  /**
   * List of providers collected from all NgModules that were imported by
   * standalone components used within this defer block.
   */
  providers: Provider[] | null;

  /**
   * List of hydrate triggers for a given block
   */
  hydrateTriggers: Set<DeferBlockTrigger | HydrateTriggerDetails> | null;

  /**
   * List of prefetch triggers for a given block
   */
  prefetchTriggers: Set<DeferBlockTrigger> | null;
}

/**
 * Describes the current state of this defer block instance.
 *
 * @publicApi
 */
export enum DeferBlockState {
  /** The placeholder block content is rendered */
  Placeholder = 0,

  /** The loading block content is rendered */
  Loading = 1,

  /** The main content block content is rendered */
  Complete = 2,

  /** The error block content is rendered */
  Error = 3,
}

/**
 * Represents defer trigger types.
 */
export const enum DeferBlockTrigger {
  Idle,
  Immediate,
  Viewport,
  Interaction,
  Hover,
  Timer,
  When,
  Never,
}

/**
 * Describes hydration specific details for triggers that are necessary
 * for invoking incremental hydration with the proper timing.
 */
export interface HydrateTriggerDetails {
  trigger: DeferBlockTrigger;
  delay?: number;
}

/**
 * Describes the initial state of this defer block instance.
 *
 * Note: this state is internal only and *must* be represented
 * with a number lower than any value in the `DeferBlockState` enum.
 */
export enum DeferBlockInternalState {
  /** Initial state. Nothing is rendered yet. */
  Initial = -1,
}

export const NEXT_DEFER_BLOCK_STATE = 0;
// Note: it's *important* to keep the state in this slot, because this slot
// is used by runtime logic to differentiate between LViews, LContainers and
// other types (see `isLView` and `isLContainer` functions). In case of defer
// blocks, this slot would always be a number.
export const DEFER_BLOCK_STATE = 1;
export const STATE_IS_FROZEN_UNTIL = 2;
export const LOADING_AFTER_CLEANUP_FN = 3;
export const TRIGGER_CLEANUP_FNS = 4;
export const PREFETCH_TRIGGER_CLEANUP_FNS = 5;
export const UNIQUE_SSR_ID = 6;
export const SSR_STATE = 7;
export const ON_COMPLETE_FNS = 8;
export const HYDRATE_TRIGGER_CLEANUP_FNS = 9;

/**
 * Describes instance-specific defer block data.
 *
 * Note: currently there is only the `state` slot, but more slots
 * would be added later to keep track of `after` and `maximum` features
 * (which would require per-instance state).
 */
export interface LDeferBlockDetails extends Array<unknown> {
  /**
   * Currently rendered block state.
   */
  [DEFER_BLOCK_STATE]: DeferBlockState | DeferBlockInternalState;

  /**
   * Block state that was requested when another state was rendered.
   */
  [NEXT_DEFER_BLOCK_STATE]: DeferBlockState | null;

  /**
   * Timestamp indicating when the current state can be switched to
   * the next one, in case teh current state has `minimum` parameter.
   */
  [STATE_IS_FROZEN_UNTIL]: number | null;

  /**
   * Contains a reference to a cleanup function which cancels a timeout
   * when Angular waits before rendering loading state. This is used when
   * the loading block has the `after` parameter configured.
   */
  [LOADING_AFTER_CLEANUP_FN]: VoidFunction | null;

  /**
   * List of cleanup functions for regular triggers.
   */
  [TRIGGER_CLEANUP_FNS]: VoidFunction[] | null;

  /**
   * List of cleanup functions for prefetch triggers.
   */
  [PREFETCH_TRIGGER_CLEANUP_FNS]: VoidFunction[] | null;

  /**
   * Unique id of this defer block assigned during SSR.
   */
  [UNIQUE_SSR_ID]: string | null;

  /**
   * Defer block state after SSR.
   */
  [SSR_STATE]: number | null;

  /**
   * A set of callbacks to be invoked once the main content is rendered.
   */
  [ON_COMPLETE_FNS]: VoidFunction[] | null;

  /**
   * List of cleanup functions for hydrate triggers.
   */
  [HYDRATE_TRIGGER_CLEANUP_FNS]: VoidFunction[] | null;
}

/**
 * Internal structure used for configuration of defer block behavior.
 * */
export interface DeferBlockConfig {
  behavior: DeferBlockBehavior;
}

/**
 * Options for configuring defer blocks behavior.
 * @publicApi
 */
export enum DeferBlockBehavior {
  /**
   * Manual triggering mode for defer blocks. Provides control over when defer blocks render
   * and which state they render.
   */
  Manual,

  /**
   * Playthrough mode for defer blocks. This mode behaves like defer blocks would in a browser.
   * This is the default behavior in test environments.
   */
  Playthrough,
}

/**
 * **INTERNAL**, avoid referencing it in application code.
 *
 * Describes a helper class that allows to intercept a call to retrieve current
 * dependency loading function and replace it with a different implementation.
 * This interceptor class is needed to allow testing blocks in different states
 * by simulating loading response.
 */
export interface DeferBlockDependencyInterceptor {
  /**
   * Invoked for each defer block when dependency loading function is accessed.
   */
  intercept(dependencyFn: DependencyResolverFn | null): DependencyResolverFn | null;

  /**
   * Allows to configure an interceptor function.
   */
  setInterceptor(interceptorFn: (current: DependencyResolverFn) => DependencyResolverFn): void;
}
