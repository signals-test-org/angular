/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {LocationStrategy, HashLocationStrategy, Location} from '@angular/common';
import {
  Injectable,
  DestroyRef,
  inject as coreInject,
  Component,
  NgModule,
  InjectionToken,
  EnvironmentInjector,
} from '@angular/core';
import {inject, fakeAsync, TestBed, tick, ComponentFixture} from '@angular/core/testing';
import {Subject, Observable, of, concat} from 'rxjs';
import {delay, tap, mapTo, first, takeWhile, last} from 'rxjs/operators';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Event,
  Router,
  NavigationStart,
  RoutesRecognized,
  GuardsCheckStart,
  ChildActivationStart,
  ActivationStart,
  GuardsCheckEnd,
  NavigationCancel,
  ResolveStart,
  ResolveEnd,
  ActivationEnd,
  ChildActivationEnd,
  NavigationEnd,
  provideRouter,
  withRouterConfig,
  RedirectCommand,
  RunGuardsAndResolvers,
  Data,
  RouterModule,
  NavigationCancellationCode,
  RouteConfigLoadStart,
  RouteConfigLoadEnd,
  UrlTree,
  CanMatchFn,
  CanActivateFn,
  CanActivateChildFn,
} from '../../src';
import {wrapIntoObservable} from '../../src/utils/collection';
import {RouterTestingHarness} from '../../testing';
import {expect} from '@angular/platform-browser/testing/src/matchers';
import {
  createRoot,
  TeamCmp,
  advance,
  RootCmp,
  BlankCmp,
  expectEvents,
  RouteCmp,
  RootCmpWithTwoOutlets,
  WrapperCmp,
  ThrowingCmp,
  SimpleCmp,
  TwoOutletsCmp,
  UserCmp,
  ModuleWithBlankCmpAsRoute,
} from './integration_helpers';

export function guardsIntegrationSuite() {
  describe('guards', () => {
    describe('CanActivate', () => {
      describe('guard completes before emitting a value', () => {
        @Injectable({providedIn: 'root'})
        class CompletesBeforeEmitting {
          private subject$ = new Subject<boolean>();

          constructor(destroyRef: DestroyRef) {
            destroyRef.onDestroy(() => this.subject$.complete());
          }

          // Note that this is a simple illustrative case of when an observable
          // completes without emitting a value. In a real-world scenario, this
          // might represent an HTTP request that never emits before the app is
          // destroyed and then completes when the app is destroyed.
          canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
            return this.subject$;
          }
        }

        it('should not thrown an unhandled promise rejection', fakeAsync(
          inject([Router], async (router: Router) => {
            const fixture = createRoot(router, RootCmp);

            const onUnhandledrejection = jasmine.createSpy();
            window.addEventListener('unhandledrejection', onUnhandledrejection);

            router.resetConfig([
              {path: 'team/:id', component: TeamCmp, canActivate: [CompletesBeforeEmitting]},
            ]);

            router.navigateByUrl('/team/22');

            // This was previously throwing an error `NG0205: Injector has already been destroyed`.
            fixture.destroy();

            // Wait until the event task is dispatched.
            await new Promise((resolve) => setTimeout(resolve, 10));
            window.removeEventListener('unhandledrejection', onUnhandledrejection);

            expect(onUnhandledrejection).not.toHaveBeenCalled();
          }),
        ));
      });

      describe('should not activate a route when CanActivate returns false', () => {
        beforeEach(() => {
          TestBed.configureTestingModule({
            providers: [{provide: 'alwaysFalse', useValue: (a: any, b: any) => false}],
          });
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            const recordedEvents: Event[] = [];
            router.events.forEach((e) => recordedEvents.push(e));

            router.resetConfig([
              {path: 'team/:id', component: TeamCmp, canActivate: ['alwaysFalse']},
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);

            expect(location.path()).toEqual('');
            expectEvents(recordedEvents, [
              [NavigationStart, '/team/22'],
              [RoutesRecognized, '/team/22'],
              [GuardsCheckStart, '/team/22'],
              [ChildActivationStart],
              [ActivationStart],
              [GuardsCheckEnd, '/team/22'],
              [NavigationCancel, '/team/22'],
            ]);
            expect((recordedEvents[5] as GuardsCheckEnd).shouldActivate).toBe(false);
          }),
        ));
      });

      describe('should not activate a route when CanActivate returns false (componentless route)', () => {
        beforeEach(() => {
          TestBed.configureTestingModule({
            providers: [{provide: 'alwaysFalse', useValue: (a: any, b: any) => false}],
          });
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {
                path: 'parent',
                canActivate: ['alwaysFalse'],
                children: [{path: 'team/:id', component: TeamCmp}],
              },
            ]);

            router.navigateByUrl('parent/team/22');
            advance(fixture);

            expect(location.path()).toEqual('');
          }),
        ));
      });

      describe('should activate a route when CanActivate returns true', () => {
        beforeEach(() => {
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'alwaysTrue',
                useValue: (a: ActivatedRouteSnapshot, s: RouterStateSnapshot) => true,
              },
            ],
          });
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {path: 'team/:id', component: TeamCmp, canActivate: ['alwaysTrue']},
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);
            expect(location.path()).toEqual('/team/22');
          }),
        ));
      });

      describe('should work when given a class', () => {
        class AlwaysTrue {
          canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
            return true;
          }
        }

        beforeEach(() => {
          TestBed.configureTestingModule({providers: [AlwaysTrue]});
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([{path: 'team/:id', component: TeamCmp, canActivate: [AlwaysTrue]}]);

            router.navigateByUrl('/team/22');
            advance(fixture);

            expect(location.path()).toEqual('/team/22');
          }),
        ));
      });

      describe('should work when returns an observable', () => {
        beforeEach(() => {
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'CanActivate',
                useValue: (a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                  return new Observable<boolean>((observer) => {
                    observer.next(false);
                  });
                },
              },
            ],
          });
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {path: 'team/:id', component: TeamCmp, canActivate: ['CanActivate']},
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);
            expect(location.path()).toEqual('');
          }),
        ));
      });

      describe('should work when returns a promise', () => {
        beforeEach(() => {
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'CanActivate',
                useValue: (a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                  if (a.params['id'] === '22') {
                    return Promise.resolve(true);
                  } else {
                    return Promise.resolve(false);
                  }
                },
              },
            ],
          });
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {path: 'team/:id', component: TeamCmp, canActivate: ['CanActivate']},
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);
            expect(location.path()).toEqual('/team/22');

            router.navigateByUrl('/team/33');
            advance(fixture);
            expect(location.path()).toEqual('/team/22');
          }),
        ));
      });

      describe('should reset the location when cancelling a navigation', () => {
        beforeEach(() => {
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'alwaysFalse',
                useValue: (a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                  return false;
                },
              },
              {provide: LocationStrategy, useClass: HashLocationStrategy},
            ],
          });
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {path: 'one', component: SimpleCmp},
              {path: 'two', component: SimpleCmp, canActivate: ['alwaysFalse']},
            ]);

            router.navigateByUrl('/one');
            advance(fixture);
            expect(location.path()).toEqual('/one');

            location.go('/two');
            location.historyGo(0);
            advance(fixture);
            expect(location.path()).toEqual('/one');
          }),
        ));
      });

      describe('should redirect to / when guard returns false', () => {
        beforeEach(() =>
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'returnFalseAndNavigate',
                useFactory: (router: Router) => () => {
                  router.navigate(['/']);
                  return false;
                },
                deps: [Router],
              },
            ],
          }),
        );

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            router.resetConfig([
              {
                path: '',
                component: SimpleCmp,
              },
              {path: 'one', component: RouteCmp, canActivate: ['returnFalseAndNavigate']},
            ]);

            const fixture = TestBed.createComponent(RootCmp);
            router.navigateByUrl('/one');
            advance(fixture);
            expect(location.path()).toEqual('');
            expect(fixture.nativeElement).toHaveText('simple');
          }),
        ));
      });

      describe('should redirect when guard returns UrlTree', () => {
        beforeEach(() =>
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'returnUrlTree',
                useFactory: (router: Router) => () => {
                  return router.parseUrl('/redirected');
                },
                deps: [Router],
              },
              {
                provide: 'returnRootUrlTree',
                useFactory: (router: Router) => () => {
                  return router.parseUrl('/');
                },
                deps: [Router],
              },
            ],
          }),
        );

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const recordedEvents: Event[] = [];
            let cancelEvent: NavigationCancel = null!;
            router.events.forEach((e) => {
              recordedEvents.push(e);
              if (e instanceof NavigationCancel) cancelEvent = e;
            });
            router.resetConfig([
              {path: '', component: SimpleCmp},
              {path: 'one', component: RouteCmp, canActivate: ['returnUrlTree']},
              {path: 'redirected', component: SimpleCmp},
            ]);

            const fixture = TestBed.createComponent(RootCmp);
            router.navigateByUrl('/one');

            advance(fixture);

            expect(location.path()).toEqual('/redirected');
            expect(fixture.nativeElement).toHaveText('simple');
            expect(cancelEvent && cancelEvent.reason).toBe(
              'NavigationCancelingError: Redirecting to "/redirected"',
            );
            expectEvents(recordedEvents, [
              [NavigationStart, '/one'],
              [RoutesRecognized, '/one'],
              [GuardsCheckStart, '/one'],
              [ChildActivationStart, undefined],
              [ActivationStart, undefined],
              [NavigationCancel, '/one'],
              [NavigationStart, '/redirected'],
              [RoutesRecognized, '/redirected'],
              [GuardsCheckStart, '/redirected'],
              [ChildActivationStart, undefined],
              [ActivationStart, undefined],
              [GuardsCheckEnd, '/redirected'],
              [ResolveStart, '/redirected'],
              [ResolveEnd, '/redirected'],
              [ActivationEnd, undefined],
              [ChildActivationEnd, undefined],
              [NavigationEnd, '/redirected'],
            ]);
          }),
        ));

        it('works with root url', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const recordedEvents: Event[] = [];
            let cancelEvent: NavigationCancel = null!;
            router.events.forEach((e: any) => {
              recordedEvents.push(e);
              if (e instanceof NavigationCancel) cancelEvent = e;
            });
            router.resetConfig([
              {path: '', component: SimpleCmp},
              {path: 'one', component: RouteCmp, canActivate: ['returnRootUrlTree']},
            ]);

            const fixture = TestBed.createComponent(RootCmp);
            router.navigateByUrl('/one');

            advance(fixture);

            expect(location.path()).toEqual('');
            expect(fixture.nativeElement).toHaveText('simple');
            expect(cancelEvent && cancelEvent.reason).toBe(
              'NavigationCancelingError: Redirecting to "/"',
            );
            expectEvents(recordedEvents, [
              [NavigationStart, '/one'],
              [RoutesRecognized, '/one'],
              [GuardsCheckStart, '/one'],
              [ChildActivationStart, undefined],
              [ActivationStart, undefined],
              [NavigationCancel, '/one'],
              [NavigationStart, '/'],
              [RoutesRecognized, '/'],
              [GuardsCheckStart, '/'],
              [ChildActivationStart, undefined],
              [ActivationStart, undefined],
              [GuardsCheckEnd, '/'],
              [ResolveStart, '/'],
              [ResolveEnd, '/'],
              [ActivationEnd, undefined],
              [ChildActivationEnd, undefined],
              [NavigationEnd, '/'],
            ]);
          }),
        ));

        it('replaces URL when URL is updated eagerly so back button can still work', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [provideRouter([], withRouterConfig({urlUpdateStrategy: 'eager'}))],
          });
          const router = TestBed.inject(Router);
          const location = TestBed.inject(Location);
          router.resetConfig([
            {path: '', component: SimpleCmp},
            {path: 'one', component: RouteCmp, canActivate: ['returnUrlTree']},
            {path: 'redirected', component: SimpleCmp},
          ]);
          createRoot(router, RootCmp);
          router.navigateByUrl('/one');
          const urlChanges: string[] = [];
          location.onUrlChange((change) => {
            urlChanges.push(change);
          });

          tick();

          expect(location.path()).toEqual('/redirected');
          expect(urlChanges).toEqual(['/one', '/redirected']);
          location.back();
          tick();
          expect(location.path()).toEqual('');
        }));

        it('should resolve navigateByUrl promise after redirect finishes', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [provideRouter([], withRouterConfig({urlUpdateStrategy: 'eager'}))],
          });
          const router = TestBed.inject(Router);
          const location = TestBed.inject(Location);
          let resolvedPath = '';
          router.resetConfig([
            {path: '', component: SimpleCmp},
            {path: 'one', component: RouteCmp, canActivate: ['returnUrlTree']},
            {path: 'redirected', component: SimpleCmp},
          ]);
          const fixture = createRoot(router, RootCmp);
          router.navigateByUrl('/one').then((v) => {
            resolvedPath = location.path();
          });

          tick();
          expect(resolvedPath).toBe('/redirected');
        }));

        it('can redirect to 404 without changing the URL', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [provideRouter([], withRouterConfig({urlUpdateStrategy: 'eager'}))],
          });
          const router = TestBed.inject(Router);
          const location = TestBed.inject(Location);
          router.resetConfig([
            {path: '', component: SimpleCmp},
            {
              path: 'one',
              component: RouteCmp,
              canActivate: [
                () => new RedirectCommand(router.parseUrl('/404'), {skipLocationChange: true}),
              ],
            },
            {path: '404', component: SimpleCmp},
          ]);
          const fixture = createRoot(router, RootCmp);
          router.navigateByUrl('/one');

          advance(fixture);

          expect(location.path()).toEqual('/one');
          expect(router.url.toString()).toEqual('/404');
        }));

        it('can redirect while changing state object', fakeAsync(() => {
          TestBed.configureTestingModule({
            providers: [provideRouter([], withRouterConfig({urlUpdateStrategy: 'eager'}))],
          });
          const router = TestBed.inject(Router);
          const location = TestBed.inject(Location);
          router.resetConfig([
            {path: '', component: SimpleCmp},
            {
              path: 'one',
              component: RouteCmp,
              canActivate: [
                () => new RedirectCommand(router.parseUrl('/redirected'), {state: {test: 1}}),
              ],
            },
            {path: 'redirected', component: SimpleCmp},
          ]);
          const fixture = createRoot(router, RootCmp);
          router.navigateByUrl('/one');

          advance(fixture);

          expect(location.path()).toEqual('/redirected');
          expect(location.getState()).toEqual(jasmine.objectContaining({test: 1}));
        }));
      });

      it('can redirect to 404 without changing the URL', async () => {
        TestBed.configureTestingModule({
          providers: [
            provideRouter([
              {
                path: 'one',
                component: RouteCmp,
                canActivate: [
                  () => {
                    const router = coreInject(Router);
                    router.navigateByUrl('/404', {
                      browserUrl: router.getCurrentNavigation()?.finalUrl,
                    });
                    return false;
                  },
                ],
              },
              {path: '404', component: SimpleCmp},
            ]),
          ],
        });
        const location = TestBed.inject(Location);
        await RouterTestingHarness.create('/one');

        expect(location.path()).toEqual('/one');
        expect(TestBed.inject(Router).url.toString()).toEqual('/404');
      });

      it('can navigate to same internal route with different browser url', async () => {
        TestBed.configureTestingModule({
          providers: [provideRouter([{path: 'one', component: RouteCmp}])],
        });
        const location = TestBed.inject(Location);
        const router = TestBed.inject(Router);
        await RouterTestingHarness.create('/one');
        await router.navigateByUrl('/one', {browserUrl: '/two'});

        expect(location.path()).toEqual('/two');
        expect(router.url.toString()).toEqual('/one');
      });

      it('retains browserUrl through UrlTree redirects', async () => {
        TestBed.configureTestingModule({
          providers: [
            provideRouter([
              {
                path: 'one',
                component: RouteCmp,
                canActivate: [() => coreInject(Router).parseUrl('/404')],
              },
              {path: '404', component: SimpleCmp},
            ]),
          ],
        });
        const router = TestBed.inject(Router);
        const location = TestBed.inject(Location);
        await RouterTestingHarness.create();
        await router.navigateByUrl('/one', {browserUrl: router.parseUrl('abc123')});

        expect(location.path()).toEqual('/abc123');
        expect(TestBed.inject(Router).url.toString()).toEqual('/404');
      });

      describe('runGuardsAndResolvers', () => {
        let guardRunCount = 0;
        let resolverRunCount = 0;

        beforeEach(() => {
          guardRunCount = 0;
          resolverRunCount = 0;
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'guard',
                useValue: () => {
                  guardRunCount++;
                  return true;
                },
              },
              {provide: 'resolver', useValue: () => resolverRunCount++},
            ],
          });
        });

        function configureRouter(
          router: Router,
          runGuardsAndResolvers: RunGuardsAndResolvers,
        ): ComponentFixture<RootCmpWithTwoOutlets> {
          const fixture = createRoot(router, RootCmpWithTwoOutlets);

          router.resetConfig([
            {
              path: 'a',
              runGuardsAndResolvers,
              component: RouteCmp,
              canActivate: ['guard'],
              resolve: {data: 'resolver'},
            },
            {path: 'b', component: SimpleCmp, outlet: 'right'},
            {
              path: 'c/:param',
              runGuardsAndResolvers,
              component: RouteCmp,
              canActivate: ['guard'],
              resolve: {data: 'resolver'},
            },
            {
              path: 'd/:param',
              component: WrapperCmp,
              runGuardsAndResolvers,
              children: [
                {
                  path: 'e/:param',
                  component: SimpleCmp,
                  canActivate: ['guard'],
                  resolve: {data: 'resolver'},
                },
              ],
            },
            {
              path: 'throwing',
              runGuardsAndResolvers,
              component: ThrowingCmp,
              canActivate: ['guard'],
              resolve: {data: 'resolver'},
            },
          ]);

          router.navigateByUrl('/a');
          advance(fixture);
          return fixture;
        }

        it('should rerun guards and resolvers when params change', fakeAsync(
          inject([Router], (router: Router) => {
            const fixture = configureRouter(router, 'paramsChange');

            const cmp: RouteCmp = fixture.debugElement.children[1].componentInstance;
            const recordedData: Data[] = [];
            cmp.route.data.subscribe((data) => recordedData.push(data));

            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            router.navigateByUrl('/a;p=1');
            advance(fixture);
            expect(guardRunCount).toEqual(2);
            expect(recordedData).toEqual([{data: 0}, {data: 1}]);

            router.navigateByUrl('/a;p=2');
            advance(fixture);
            expect(guardRunCount).toEqual(3);
            expect(recordedData).toEqual([{data: 0}, {data: 1}, {data: 2}]);

            router.navigateByUrl('/a;p=2?q=1');
            advance(fixture);
            expect(guardRunCount).toEqual(3);
            expect(recordedData).toEqual([{data: 0}, {data: 1}, {data: 2}]);
          }),
        ));

        it('should rerun guards and resolvers when query params change', fakeAsync(
          inject([Router], (router: Router) => {
            const fixture = configureRouter(router, 'paramsOrQueryParamsChange');

            const cmp: RouteCmp = fixture.debugElement.children[1].componentInstance;
            const recordedData: Data[] = [];
            cmp.route.data.subscribe((data) => recordedData.push(data));

            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            router.navigateByUrl('/a;p=1');
            advance(fixture);
            expect(guardRunCount).toEqual(2);
            expect(recordedData).toEqual([{data: 0}, {data: 1}]);

            router.navigateByUrl('/a;p=2');
            advance(fixture);
            expect(guardRunCount).toEqual(3);
            expect(recordedData).toEqual([{data: 0}, {data: 1}, {data: 2}]);

            router.navigateByUrl('/a;p=2?q=1');
            advance(fixture);
            expect(guardRunCount).toEqual(4);
            expect(recordedData).toEqual([{data: 0}, {data: 1}, {data: 2}, {data: 3}]);

            router.navigateByUrl('/a;p=2(right:b)?q=1');
            advance(fixture);
            expect(guardRunCount).toEqual(4);
            expect(recordedData).toEqual([{data: 0}, {data: 1}, {data: 2}, {data: 3}]);
          }),
        ));

        it('should always rerun guards and resolvers', fakeAsync(
          inject([Router], (router: Router) => {
            const fixture = configureRouter(router, 'always');

            const cmp: RouteCmp = fixture.debugElement.children[1].componentInstance;
            const recordedData: Data[] = [];
            cmp.route.data.subscribe((data) => recordedData.push(data));

            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            router.navigateByUrl('/a;p=1');
            advance(fixture);
            expect(guardRunCount).toEqual(2);
            expect(recordedData).toEqual([{data: 0}, {data: 1}]);

            router.navigateByUrl('/a;p=2');
            advance(fixture);
            expect(guardRunCount).toEqual(3);
            expect(recordedData).toEqual([{data: 0}, {data: 1}, {data: 2}]);

            router.navigateByUrl('/a;p=2?q=1');
            advance(fixture);
            expect(guardRunCount).toEqual(4);
            expect(recordedData).toEqual([{data: 0}, {data: 1}, {data: 2}, {data: 3}]);

            router.navigateByUrl('/a;p=2(right:b)?q=1');
            advance(fixture);
            expect(guardRunCount).toEqual(5);
            expect(recordedData).toEqual([{data: 0}, {data: 1}, {data: 2}, {data: 3}, {data: 4}]);

            // Issue #39030, always running guards and resolvers should not throw
            // when navigating away from a component with a throwing constructor.
            expect(() => {
              router.navigateByUrl('/throwing').catch(() => {});
              advance(fixture);
              router.navigateByUrl('/a;p=1');
              advance(fixture);
            }).not.toThrow();
          }),
        ));

        it('should rerun rerun guards and resolvers when path params change', fakeAsync(
          inject([Router], (router: Router) => {
            const fixture = configureRouter(router, 'pathParamsChange');

            const cmp: RouteCmp = fixture.debugElement.children[1].componentInstance;
            const recordedData: Data[] = [];
            cmp.route.data.subscribe((data) => recordedData.push(data));

            // First navigation has already run
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            // Changing any optional params will not result in running guards or resolvers
            router.navigateByUrl('/a;p=1');
            advance(fixture);
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            router.navigateByUrl('/a;p=2');
            advance(fixture);
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            router.navigateByUrl('/a;p=2?q=1');
            advance(fixture);
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            router.navigateByUrl('/a;p=2(right:b)?q=1');
            advance(fixture);
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            // Change to new route with path param should run guards and resolvers
            router.navigateByUrl('/c/paramValue');
            advance(fixture);

            expect(guardRunCount).toEqual(2);

            // Modifying a path param should run guards and resolvers
            router.navigateByUrl('/c/paramValueChanged');
            advance(fixture);
            expect(guardRunCount).toEqual(3);

            // Adding optional params should not cause guards/resolvers to run
            router.navigateByUrl('/c/paramValueChanged;p=1?q=2');
            advance(fixture);
            expect(guardRunCount).toEqual(3);
          }),
        ));

        it('should rerun when a parent segment changes', fakeAsync(
          inject([Router], (router: Router) => {
            const fixture = configureRouter(router, 'pathParamsChange');

            const cmp: RouteCmp = fixture.debugElement.children[1].componentInstance;

            // Land on an initial page
            router.navigateByUrl('/d/1;dd=11/e/2;dd=22');
            advance(fixture);

            expect(guardRunCount).toEqual(2);

            // Changes cause re-run on the config with the guard
            router.navigateByUrl('/d/1;dd=11/e/3;ee=22');
            advance(fixture);

            expect(guardRunCount).toEqual(3);

            // Changes to the parent also cause re-run
            router.navigateByUrl('/d/2;dd=11/e/3;ee=22');
            advance(fixture);

            expect(guardRunCount).toEqual(4);
          }),
        ));

        it('should rerun rerun guards and resolvers when path or query params change', fakeAsync(
          inject([Router], (router: Router) => {
            const fixture = configureRouter(router, 'pathParamsOrQueryParamsChange');

            const cmp: RouteCmp = fixture.debugElement.children[1].componentInstance;
            const recordedData: Data[] = [];
            cmp.route.data.subscribe((data) => recordedData.push(data));

            // First navigation has already run
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            // Changing matrix params will not result in running guards or resolvers
            router.navigateByUrl('/a;p=1');
            advance(fixture);
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            router.navigateByUrl('/a;p=2');
            advance(fixture);
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            // Adding query params will re-run guards/resolvers
            router.navigateByUrl('/a;p=2?q=1');
            advance(fixture);
            expect(guardRunCount).toEqual(2);
            expect(recordedData).toEqual([{data: 0}, {data: 1}]);

            // Changing query params will re-run guards/resolvers
            router.navigateByUrl('/a;p=2?q=2');
            advance(fixture);
            expect(guardRunCount).toEqual(3);
            expect(recordedData).toEqual([{data: 0}, {data: 1}, {data: 2}]);
          }),
        ));

        it('should allow a predicate function to determine when to run guards and resolvers', fakeAsync(
          inject([Router], (router: Router) => {
            const fixture = configureRouter(router, (from, to) => to.paramMap.get('p') === '2');

            const cmp: RouteCmp = fixture.debugElement.children[1].componentInstance;
            const recordedData: Data[] = [];
            cmp.route.data.subscribe((data) => recordedData.push(data));

            // First navigation has already run
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            // Adding `p` param shouldn't cause re-run
            router.navigateByUrl('/a;p=1');
            advance(fixture);
            expect(guardRunCount).toEqual(1);
            expect(recordedData).toEqual([{data: 0}]);

            // Re-run should trigger on p=2
            router.navigateByUrl('/a;p=2');
            advance(fixture);
            expect(guardRunCount).toEqual(2);
            expect(recordedData).toEqual([{data: 0}, {data: 1}]);

            // Any other changes don't pass the predicate
            router.navigateByUrl('/a;p=3?q=1');
            advance(fixture);
            expect(guardRunCount).toEqual(2);
            expect(recordedData).toEqual([{data: 0}, {data: 1}]);

            // Changing query params will re-run guards/resolvers
            router.navigateByUrl('/a;p=3?q=2');
            advance(fixture);
            expect(guardRunCount).toEqual(2);
            expect(recordedData).toEqual([{data: 0}, {data: 1}]);
          }),
        ));
      });

      describe('should wait for parent to complete', () => {
        let log: string[];

        beforeEach(() => {
          log = [];
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'parentGuard',
                useValue: () => {
                  return delayPromise(10).then(() => {
                    log.push('parent');
                    return true;
                  });
                },
              },
              {
                provide: 'childGuard',
                useValue: () => {
                  return delayPromise(5).then(() => {
                    log.push('child');
                    return true;
                  });
                },
              },
            ],
          });
        });

        function delayPromise(delay: number): Promise<boolean> {
          let resolve: (val: boolean) => void;
          const promise = new Promise<boolean>((res) => (resolve = res));
          setTimeout(() => resolve(true), delay);
          return promise;
        }

        it('works', fakeAsync(
          inject([Router], (router: Router) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {
                path: 'parent',
                canActivate: ['parentGuard'],
                children: [{path: 'child', component: SimpleCmp, canActivate: ['childGuard']}],
              },
            ]);

            router.navigateByUrl('/parent/child');
            advance(fixture);
            tick(15);
            expect(log).toEqual(['parent', 'child']);
          }),
        ));
      });
    });

    describe('CanDeactivate', () => {
      let log: any;

      beforeEach(() => {
        log = [];

        TestBed.configureTestingModule({
          providers: [
            {
              provide: 'CanDeactivateParent',
              useValue: (c: any, a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                return a.params['id'] === '22';
              },
            },
            {
              provide: 'CanDeactivateTeam',
              useValue: (c: any, a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                return c.route.snapshot.params['id'] === '22';
              },
            },
            {
              provide: 'CanDeactivateUser',
              useValue: (c: any, a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                return a.params['name'] === 'victor';
              },
            },
            {
              provide: 'RecordingDeactivate',
              useValue: (c: any, a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                log.push({path: a.routeConfig!.path, component: c});
                return true;
              },
            },
            {
              provide: 'alwaysFalse',
              useValue: (c: any, a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                return false;
              },
            },
            {
              provide: 'alwaysFalseAndLogging',
              useValue: (c: any, a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                log.push('called');
                return false;
              },
            },
            {
              provide: 'alwaysFalseWithDelayAndLogging',
              useValue: () => {
                log.push('called');
                let resolve: (result: boolean) => void;
                const promise = new Promise((res) => (resolve = res));
                setTimeout(() => resolve(false), 0);
                return promise;
              },
            },
            {
              provide: 'canActivate_alwaysTrueAndLogging',
              useValue: () => {
                log.push('canActivate called');
                return true;
              },
            },
          ],
        });
      });

      describe('should not deactivate a route when CanDeactivate returns false', () => {
        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {path: 'team/:id', component: TeamCmp, canDeactivate: ['CanDeactivateTeam']},
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);
            expect(location.path()).toEqual('/team/22');

            let successStatus: boolean = false;
            router.navigateByUrl('/team/33')!.then((res) => (successStatus = res));
            advance(fixture);
            expect(location.path()).toEqual('/team/33');
            expect(successStatus).toEqual(true);

            let canceledStatus: boolean = false;
            router.navigateByUrl('/team/44')!.then((res) => (canceledStatus = res));
            advance(fixture);
            expect(location.path()).toEqual('/team/33');
            expect(canceledStatus).toEqual(false);
          }),
        ));

        it('works with componentless routes', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {
                path: 'grandparent',
                canDeactivate: ['RecordingDeactivate'],
                children: [
                  {
                    path: 'parent',
                    canDeactivate: ['RecordingDeactivate'],
                    children: [
                      {
                        path: 'child',
                        canDeactivate: ['RecordingDeactivate'],
                        children: [
                          {
                            path: 'simple',
                            component: SimpleCmp,
                            canDeactivate: ['RecordingDeactivate'],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {path: 'simple', component: SimpleCmp},
            ]);

            router.navigateByUrl('/grandparent/parent/child/simple');
            advance(fixture);
            expect(location.path()).toEqual('/grandparent/parent/child/simple');

            router.navigateByUrl('/simple');
            advance(fixture);

            const child = fixture.debugElement.children[1].componentInstance;

            expect(log.map((a: any) => a.path)).toEqual([
              'simple',
              'child',
              'parent',
              'grandparent',
            ]);
            expect(log[0].component instanceof SimpleCmp).toBeTruthy();
            [1, 2, 3].forEach((i) => expect(log[i].component).toBeNull());
            expect(child instanceof SimpleCmp).toBeTruthy();
            expect(child).not.toBe(log[0].component);
          }),
        ));

        it('works with aux routes', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {
                path: 'two-outlets',
                component: TwoOutletsCmp,
                children: [
                  {path: 'a', component: BlankCmp},
                  {
                    path: 'b',
                    canDeactivate: ['RecordingDeactivate'],
                    component: SimpleCmp,
                    outlet: 'aux',
                  },
                ],
              },
            ]);

            router.navigateByUrl('/two-outlets/(a//aux:b)');
            advance(fixture);
            expect(location.path()).toEqual('/two-outlets/(a//aux:b)');

            router.navigate(['two-outlets', {outlets: {aux: null}}]);
            advance(fixture);

            expect(log.map((a: any) => a.path)).toEqual(['b']);
            expect(location.path()).toEqual('/two-outlets/a');
          }),
        ));

        it('works with a nested route', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {
                path: 'team/:id',
                component: TeamCmp,
                children: [
                  {path: '', pathMatch: 'full', component: SimpleCmp},
                  {path: 'user/:name', component: UserCmp, canDeactivate: ['CanDeactivateUser']},
                ],
              },
            ]);

            router.navigateByUrl('/team/22/user/victor');
            advance(fixture);

            // this works because we can deactivate victor
            router.navigateByUrl('/team/33');
            advance(fixture);
            expect(location.path()).toEqual('/team/33');

            router.navigateByUrl('/team/33/user/fedor');
            advance(fixture);

            // this doesn't work cause we cannot deactivate fedor
            router.navigateByUrl('/team/44');
            advance(fixture);
            expect(location.path()).toEqual('/team/33/user/fedor');
          }),
        ));
      });

      it('should use correct component to deactivate forChild route', fakeAsync(
        inject([Router], (router: Router) => {
          @Component({
            selector: 'admin',
            template: '',
            standalone: false,
          })
          class AdminComponent {}

          @NgModule({
            declarations: [AdminComponent],
            imports: [
              RouterModule.forChild([
                {
                  path: '',
                  component: AdminComponent,
                  canDeactivate: ['RecordingDeactivate'],
                },
              ]),
            ],
          })
          class LazyLoadedModule {}

          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {
              path: 'a',
              component: WrapperCmp,
              children: [{path: '', pathMatch: 'full', loadChildren: () => LazyLoadedModule}],
            },
            {path: 'b', component: SimpleCmp},
          ]);

          router.navigateByUrl('/a');
          advance(fixture);
          router.navigateByUrl('/b');
          advance(fixture);

          expect(log[0].component).toBeInstanceOf(AdminComponent);
        }),
      ));

      it('should not create a route state if navigation is canceled', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {
              path: 'main',
              component: TeamCmp,
              children: [
                {path: 'component1', component: SimpleCmp, canDeactivate: ['alwaysFalse']},
                {path: 'component2', component: SimpleCmp},
              ],
            },
          ]);

          router.navigateByUrl('/main/component1');
          advance(fixture);

          router.navigateByUrl('/main/component2');
          advance(fixture);

          const teamCmp = fixture.debugElement.children[1].componentInstance;
          expect(teamCmp.route.firstChild.url.value[0].path).toEqual('component1');
          expect(location.path()).toEqual('/main/component1');
        }),
      ));

      it('should not run CanActivate when CanDeactivate returns false', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {
              path: 'main',
              component: TeamCmp,
              children: [
                {
                  path: 'component1',
                  component: SimpleCmp,
                  canDeactivate: ['alwaysFalseWithDelayAndLogging'],
                },
                {
                  path: 'component2',
                  component: SimpleCmp,
                  canActivate: ['canActivate_alwaysTrueAndLogging'],
                },
              ],
            },
          ]);

          router.navigateByUrl('/main/component1');
          advance(fixture);
          expect(location.path()).toEqual('/main/component1');

          router.navigateByUrl('/main/component2');
          advance(fixture);
          expect(location.path()).toEqual('/main/component1');
          expect(log).toEqual(['called']);
        }),
      ));

      it('should call guards every time when navigating to the same url over and over again', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {path: 'simple', component: SimpleCmp, canDeactivate: ['alwaysFalseAndLogging']},
            {path: 'blank', component: BlankCmp},
          ]);

          router.navigateByUrl('/simple');
          advance(fixture);

          router.navigateByUrl('/blank');
          advance(fixture);
          expect(log).toEqual(['called']);
          expect(location.path()).toEqual('/simple');

          router.navigateByUrl('/blank');
          advance(fixture);
          expect(log).toEqual(['called', 'called']);
          expect(location.path()).toEqual('/simple');
        }),
      ));

      describe('next state', () => {
        let log: string[];

        class ClassWithNextState {
          canDeactivate(
            component: TeamCmp,
            currentRoute: ActivatedRouteSnapshot,
            currentState: RouterStateSnapshot,
            nextState: RouterStateSnapshot,
          ): boolean {
            log.push(currentState.url, nextState.url);
            return true;
          }
        }

        beforeEach(() => {
          log = [];
          TestBed.configureTestingModule({
            providers: [
              ClassWithNextState,
              {
                provide: 'FunctionWithNextState',
                useValue: (
                  cmp: any,
                  currentRoute: ActivatedRouteSnapshot,
                  currentState: RouterStateSnapshot,
                  nextState: RouterStateSnapshot,
                ) => {
                  log.push(currentState.url, nextState.url);
                  return true;
                },
              },
            ],
          });
        });

        it('should pass next state as the 4 argument when guard is a class', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {
                path: 'team/:id',
                component: TeamCmp,
                canDeactivate: [
                  (
                    component: TeamCmp,
                    currentRoute: ActivatedRouteSnapshot,
                    currentState: RouterStateSnapshot,
                    nextState: RouterStateSnapshot,
                  ) =>
                    coreInject(ClassWithNextState).canDeactivate(
                      component,
                      currentRoute,
                      currentState,
                      nextState,
                    ),
                ],
              },
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);
            expect(location.path()).toEqual('/team/22');

            router.navigateByUrl('/team/33');
            advance(fixture);
            expect(location.path()).toEqual('/team/33');
            expect(log).toEqual(['/team/22', '/team/33']);
          }),
        ));

        it('should pass next state as the 4 argument when guard is a function', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {path: 'team/:id', component: TeamCmp, canDeactivate: ['FunctionWithNextState']},
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);
            expect(location.path()).toEqual('/team/22');

            router.navigateByUrl('/team/33');
            advance(fixture);
            expect(location.path()).toEqual('/team/33');
            expect(log).toEqual(['/team/22', '/team/33']);
          }),
        ));
      });

      describe('should work when given a class', () => {
        class AlwaysTrue {
          canDeactivate(): boolean {
            return true;
          }
        }

        beforeEach(() => {
          TestBed.configureTestingModule({providers: [AlwaysTrue]});
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {
                path: 'team/:id',
                component: TeamCmp,
                canDeactivate: [() => coreInject(AlwaysTrue).canDeactivate()],
              },
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);
            expect(location.path()).toEqual('/team/22');

            router.navigateByUrl('/team/33');
            advance(fixture);
            expect(location.path()).toEqual('/team/33');
          }),
        ));
      });

      describe('should work when returns an observable', () => {
        beforeEach(() => {
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'CanDeactivate',
                useValue: (c: TeamCmp, a: ActivatedRouteSnapshot, b: RouterStateSnapshot) => {
                  return new Observable<boolean>((observer) => {
                    observer.next(false);
                  });
                },
              },
            ],
          });
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {path: 'team/:id', component: TeamCmp, canDeactivate: ['CanDeactivate']},
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);
            expect(location.path()).toEqual('/team/22');

            router.navigateByUrl('/team/33');
            advance(fixture);
            expect(location.path()).toEqual('/team/22');
          }),
        ));
      });
    });

    describe('CanActivateChild', () => {
      describe('should be invoked when activating a child', () => {
        beforeEach(() => {
          TestBed.configureTestingModule({
            providers: [
              {
                provide: 'alwaysFalse',
                useValue: (a: any, b: any) => a.paramMap.get('id') === '22',
              },
            ],
          });
        });

        it('works', fakeAsync(
          inject([Router, Location], (router: Router, location: Location) => {
            const fixture = createRoot(router, RootCmp);

            router.resetConfig([
              {
                path: '',
                canActivateChild: ['alwaysFalse'],
                children: [{path: 'team/:id', component: TeamCmp}],
              },
            ]);

            router.navigateByUrl('/team/22');
            advance(fixture);

            expect(location.path()).toEqual('/team/22');

            router.navigateByUrl('/team/33')!.catch(() => {});
            advance(fixture);

            expect(location.path()).toEqual('/team/22');
          }),
        ));
      });

      it('should find the guard provided in lazy loaded module', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          @Component({
            selector: 'admin',
            template: '<router-outlet></router-outlet>',
            standalone: false,
          })
          class AdminComponent {}

          @Component({
            selector: 'lazy',
            template: 'lazy-loaded',
            standalone: false,
          })
          class LazyLoadedComponent {}

          @NgModule({
            declarations: [AdminComponent, LazyLoadedComponent],
            imports: [
              RouterModule.forChild([
                {
                  path: '',
                  component: AdminComponent,
                  children: [
                    {
                      path: '',
                      canActivateChild: ['alwaysTrue'],
                      children: [{path: '', component: LazyLoadedComponent}],
                    },
                  ],
                },
              ]),
            ],
            providers: [{provide: 'alwaysTrue', useValue: () => true}],
          })
          class LazyLoadedModule {}

          const fixture = createRoot(router, RootCmp);

          router.resetConfig([{path: 'admin', loadChildren: () => LazyLoadedModule}]);

          router.navigateByUrl('/admin');
          advance(fixture);

          expect(location.path()).toEqual('/admin');
          expect(fixture.nativeElement).toHaveText('lazy-loaded');
        }),
      ));
    });

    describe('CanLoad', () => {
      let canLoadRunCount = 0;
      beforeEach(() => {
        canLoadRunCount = 0;
        TestBed.configureTestingModule({
          providers: [
            {provide: 'alwaysFalse', useValue: (a: any) => false},
            {
              provide: 'returnUrlTree',
              useFactory: (router: Router) => () => {
                return router.createUrlTree(['blank']);
              },
              deps: [Router],
            },
            {
              provide: 'returnFalseAndNavigate',
              useFactory: (router: Router) => (a: any) => {
                router.navigate(['blank']);
                return false;
              },
              deps: [Router],
            },
            {
              provide: 'alwaysTrue',
              useValue: () => {
                canLoadRunCount++;
                return true;
              },
            },
          ],
        });
      });

      it('should not load children when CanLoad returns false', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          @Component({
            selector: 'lazy',
            template: 'lazy-loaded',
            standalone: false,
          })
          class LazyLoadedComponent {}

          @NgModule({
            declarations: [LazyLoadedComponent],
            imports: [RouterModule.forChild([{path: 'loaded', component: LazyLoadedComponent}])],
          })
          class LoadedModule {}

          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {path: 'lazyFalse', canLoad: ['alwaysFalse'], loadChildren: () => LoadedModule},
            {path: 'lazyTrue', canLoad: ['alwaysTrue'], loadChildren: () => LoadedModule},
          ]);

          const recordedEvents: Event[] = [];
          router.events.forEach((e) => recordedEvents.push(e));

          // failed navigation
          router.navigateByUrl('/lazyFalse/loaded');
          advance(fixture);

          expect(location.path()).toEqual('');

          expectEvents(recordedEvents, [
            [NavigationStart, '/lazyFalse/loaded'],
            //  [GuardsCheckStart, '/lazyFalse/loaded'],
            [NavigationCancel, '/lazyFalse/loaded'],
          ]);

          expect((recordedEvents[1] as NavigationCancel).code).toBe(
            NavigationCancellationCode.GuardRejected,
          );

          recordedEvents.splice(0);

          // successful navigation
          router.navigateByUrl('/lazyTrue/loaded');
          advance(fixture);

          expect(location.path()).toEqual('/lazyTrue/loaded');

          expectEvents(recordedEvents, [
            [NavigationStart, '/lazyTrue/loaded'],
            [RouteConfigLoadStart],
            [RouteConfigLoadEnd],
            [RoutesRecognized, '/lazyTrue/loaded'],
            [GuardsCheckStart, '/lazyTrue/loaded'],
            [ChildActivationStart],
            [ActivationStart],
            [ChildActivationStart],
            [ActivationStart],
            [GuardsCheckEnd, '/lazyTrue/loaded'],
            [ResolveStart, '/lazyTrue/loaded'],
            [ResolveEnd, '/lazyTrue/loaded'],
            [ActivationEnd],
            [ChildActivationEnd],
            [ActivationEnd],
            [ChildActivationEnd],
            [NavigationEnd, '/lazyTrue/loaded'],
          ]);
        }),
      ));

      it('should support navigating from within the guard', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {
              path: 'lazyFalse',
              canLoad: ['returnFalseAndNavigate'],
              loadChildren: jasmine.createSpy('lazyFalse'),
            },
            {path: 'blank', component: BlankCmp},
          ]);

          const recordedEvents: Event[] = [];
          router.events.forEach((e) => recordedEvents.push(e));

          router.navigateByUrl('/lazyFalse/loaded');
          advance(fixture);

          expect(location.path()).toEqual('/blank');

          expectEvents(recordedEvents, [
            [NavigationStart, '/lazyFalse/loaded'],
            // No GuardCheck events as `canLoad` is a special guard that's not actually part of
            // the guard lifecycle.
            [NavigationCancel, '/lazyFalse/loaded'],

            [NavigationStart, '/blank'],
            [RoutesRecognized, '/blank'],
            [GuardsCheckStart, '/blank'],
            [ChildActivationStart],
            [ActivationStart],
            [GuardsCheckEnd, '/blank'],
            [ResolveStart, '/blank'],
            [ResolveEnd, '/blank'],
            [ActivationEnd],
            [ChildActivationEnd],
            [NavigationEnd, '/blank'],
          ]);

          expect((recordedEvents[1] as NavigationCancel).code).toBe(
            NavigationCancellationCode.SupersededByNewNavigation,
          );
        }),
      ));

      it('should support returning UrlTree from within the guard', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {
              path: 'lazyFalse',
              canLoad: ['returnUrlTree'],
              loadChildren: jasmine.createSpy('lazyFalse'),
            },
            {path: 'blank', component: BlankCmp},
          ]);

          const recordedEvents: Event[] = [];
          router.events.forEach((e) => recordedEvents.push(e));

          router.navigateByUrl('/lazyFalse/loaded');
          advance(fixture);

          expect(location.path()).toEqual('/blank');

          expectEvents(recordedEvents, [
            [NavigationStart, '/lazyFalse/loaded'],
            // No GuardCheck events as `canLoad` is a special guard that's not actually part of
            // the guard lifecycle.
            [NavigationCancel, '/lazyFalse/loaded'],

            [NavigationStart, '/blank'],
            [RoutesRecognized, '/blank'],
            [GuardsCheckStart, '/blank'],
            [ChildActivationStart],
            [ActivationStart],
            [GuardsCheckEnd, '/blank'],
            [ResolveStart, '/blank'],
            [ResolveEnd, '/blank'],
            [ActivationEnd],
            [ChildActivationEnd],
            [NavigationEnd, '/blank'],
          ]);

          expect((recordedEvents[1] as NavigationCancel).code).toBe(
            NavigationCancellationCode.Redirect,
          );
        }),
      ));

      // Regression where navigateByUrl with false CanLoad no longer resolved `false` value on
      // navigateByUrl promise: https://github.com/angular/angular/issues/26284
      it('should resolve navigateByUrl promise after CanLoad executes', fakeAsync(
        inject([Router], (router: Router) => {
          @Component({
            selector: 'lazy',
            template: 'lazy-loaded',
            standalone: false,
          })
          class LazyLoadedComponent {}

          @NgModule({
            declarations: [LazyLoadedComponent],
            imports: [RouterModule.forChild([{path: 'loaded', component: LazyLoadedComponent}])],
          })
          class LazyLoadedModule {}

          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {path: 'lazy-false', canLoad: ['alwaysFalse'], loadChildren: () => LazyLoadedModule},
            {path: 'lazy-true', canLoad: ['alwaysTrue'], loadChildren: () => LazyLoadedModule},
          ]);

          let navFalseResult = true;
          let navTrueResult = false;
          router.navigateByUrl('/lazy-false').then((v) => {
            navFalseResult = v;
          });
          advance(fixture);
          router.navigateByUrl('/lazy-true').then((v) => {
            navTrueResult = v;
          });
          advance(fixture);

          expect(navFalseResult).toBe(false);
          expect(navTrueResult).toBe(true);
        }),
      ));

      it('should execute CanLoad only once', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          @Component({
            selector: 'lazy',
            template: 'lazy-loaded',
            standalone: false,
          })
          class LazyLoadedComponent {}

          @NgModule({
            declarations: [LazyLoadedComponent],
            imports: [RouterModule.forChild([{path: 'loaded', component: LazyLoadedComponent}])],
          })
          class LazyLoadedModule {}

          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {path: 'lazy', canLoad: ['alwaysTrue'], loadChildren: () => LazyLoadedModule},
          ]);

          router.navigateByUrl('/lazy/loaded');
          advance(fixture);
          expect(location.path()).toEqual('/lazy/loaded');
          expect(canLoadRunCount).toEqual(1);

          router.navigateByUrl('/');
          advance(fixture);
          expect(location.path()).toEqual('');

          router.navigateByUrl('/lazy/loaded');
          advance(fixture);
          expect(location.path()).toEqual('/lazy/loaded');
          expect(canLoadRunCount).toEqual(1);
        }),
      ));

      it('cancels guard execution when a new navigation happens', fakeAsync(() => {
        @Injectable({providedIn: 'root'})
        class DelayedGuard {
          static delayedExecutions = 0;
          static canLoadCalls = 0;
          canLoad() {
            DelayedGuard.canLoadCalls++;
            return of(true).pipe(
              delay(1000),
              tap(() => {
                DelayedGuard.delayedExecutions++;
              }),
            );
          }
        }
        const router = TestBed.inject(Router);
        router.resetConfig([
          {path: 'a', canLoad: [DelayedGuard], loadChildren: () => [], component: SimpleCmp},
          {path: 'team/:id', component: TeamCmp},
        ]);
        const fixture = createRoot(router, RootCmp);

        router.navigateByUrl('/a');
        tick(10);
        // The delayed guard should have started
        expect(DelayedGuard.canLoadCalls).toEqual(1);
        router.navigateByUrl('/team/1');
        advance(fixture, 1000);
        expect(fixture.nativeElement.innerHTML).toContain('team');
        // The delayed guard should not execute the delayed condition because a new navigation
        // cancels the current one and unsubscribes from intermediate results.
        expect(DelayedGuard.delayedExecutions).toEqual(0);
      }));
    });

    describe('should run CanLoad guards concurrently', () => {
      function delayObservable(delayMs: number): Observable<boolean> {
        return of(delayMs).pipe(delay(delayMs), mapTo(true));
      }

      let log: string[];

      beforeEach(() => {
        log = [];
        TestBed.configureTestingModule({
          providers: [
            {
              provide: 'guard1',
              useValue: () => {
                return delayObservable(5).pipe(tap({next: () => log.push('guard1')}));
              },
            },
            {
              provide: 'guard2',
              useValue: () => {
                return delayObservable(0).pipe(tap({next: () => log.push('guard2')}));
              },
            },
            {
              provide: 'returnFalse',
              useValue: () => {
                log.push('returnFalse');
                return false;
              },
            },
            {
              provide: 'returnFalseAndNavigate',
              useFactory: (router: Router) => () => {
                log.push('returnFalseAndNavigate');
                router.navigateByUrl('/redirected');
                return false;
              },
              deps: [Router],
            },
            {
              provide: 'returnUrlTree',
              useFactory: (router: Router) => () => {
                return delayObservable(15).pipe(
                  mapTo(router.parseUrl('/redirected')),
                  tap({next: () => log.push('returnUrlTree')}),
                );
              },
              deps: [Router],
            },
          ],
        });
      });

      it('should only execute canLoad guards of routes being activated', fakeAsync(() => {
        const router = TestBed.inject(Router);

        router.resetConfig([
          {
            path: 'lazy',
            canLoad: ['guard1'],
            loadChildren: () => of(ModuleWithBlankCmpAsRoute),
          },
          {path: 'redirected', component: SimpleCmp},
          // canLoad should not run for this route because 'lazy' activates first
          {
            path: '',
            canLoad: ['returnFalseAndNavigate'],
            loadChildren: () => of(ModuleWithBlankCmpAsRoute),
          },
        ]);

        router.navigateByUrl('/lazy');
        tick(5);
        expect(log.length).toEqual(1);
        expect(log).toEqual(['guard1']);
      }));

      it('should execute canLoad guards', fakeAsync(
        inject([Router], (router: Router) => {
          router.resetConfig([
            {
              path: 'lazy',
              canLoad: ['guard1', 'guard2'],
              loadChildren: () => ModuleWithBlankCmpAsRoute,
            },
          ]);

          router.navigateByUrl('/lazy');
          tick(5);

          expect(log.length).toEqual(2);
          expect(log).toEqual(['guard2', 'guard1']);
        }),
      ));

      it('should redirect with UrlTree if higher priority guards have resolved', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          router.resetConfig([
            {
              path: 'lazy',
              canLoad: ['returnUrlTree', 'guard1', 'guard2'],
              loadChildren: () => ModuleWithBlankCmpAsRoute,
            },
            {path: 'redirected', component: SimpleCmp},
          ]);

          router.navigateByUrl('/lazy');
          tick(15);

          expect(log.length).toEqual(3);
          expect(log).toEqual(['guard2', 'guard1', 'returnUrlTree']);
          expect(location.path()).toEqual('/redirected');
        }),
      ));

      it('should redirect with UrlTree if UrlTree is lower priority', fakeAsync(
        inject([Router, Location], (router: Router, location: Location) => {
          router.resetConfig([
            {
              path: 'lazy',
              canLoad: ['guard1', 'returnUrlTree'],
              loadChildren: () => ModuleWithBlankCmpAsRoute,
            },
            {path: 'redirected', component: SimpleCmp},
          ]);

          router.navigateByUrl('/lazy');
          tick(15);

          expect(log.length).toEqual(2);
          expect(log).toEqual(['guard1', 'returnUrlTree']);
          expect(location.path()).toEqual('/redirected');
        }),
      ));
    });

    describe('order', () => {
      class Logger {
        logs: string[] = [];
        add(thing: string) {
          this.logs.push(thing);
        }
      }

      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            Logger,
            {
              provide: 'canActivateChild_parent',
              useFactory: (logger: Logger) => () => (logger.add('canActivateChild_parent'), true),
              deps: [Logger],
            },
            {
              provide: 'canActivate_team',
              useFactory: (logger: Logger) => () => (logger.add('canActivate_team'), true),
              deps: [Logger],
            },
            {
              provide: 'canDeactivate_team',
              useFactory: (logger: Logger) => () => (logger.add('canDeactivate_team'), true),
              deps: [Logger],
            },
            {
              provide: 'canDeactivate_simple',
              useFactory: (logger: Logger) => () => (logger.add('canDeactivate_simple'), true),
              deps: [Logger],
            },
          ],
        });
      });

      it('should call guards in the right order', fakeAsync(
        inject([Router, Location, Logger], (router: Router, location: Location, logger: Logger) => {
          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {
              path: '',
              canActivateChild: ['canActivateChild_parent'],
              children: [
                {
                  path: 'team/:id',
                  canActivate: ['canActivate_team'],
                  canDeactivate: ['canDeactivate_team'],
                  component: TeamCmp,
                },
              ],
            },
          ]);

          router.navigateByUrl('/team/22');
          advance(fixture);

          router.navigateByUrl('/team/33');
          advance(fixture);

          expect(logger.logs).toEqual([
            'canActivateChild_parent',
            'canActivate_team',

            'canDeactivate_team',
            'canActivateChild_parent',
            'canActivate_team',
          ]);
        }),
      ));

      it('should call deactivate guards from bottom to top', fakeAsync(
        inject([Router, Location, Logger], (router: Router, location: Location, logger: Logger) => {
          const fixture = createRoot(router, RootCmp);

          router.resetConfig([
            {
              path: '',
              children: [
                {
                  path: 'team/:id',
                  canDeactivate: ['canDeactivate_team'],
                  children: [
                    {path: '', component: SimpleCmp, canDeactivate: ['canDeactivate_simple']},
                  ],
                  component: TeamCmp,
                },
              ],
            },
          ]);

          router.navigateByUrl('/team/22');
          advance(fixture);

          router.navigateByUrl('/team/33');
          advance(fixture);

          expect(logger.logs).toEqual(['canDeactivate_simple', 'canDeactivate_team']);
        }),
      ));
    });

    describe('canMatch', () => {
      @Injectable({providedIn: 'root'})
      class ConfigurableGuard {
        result: Promise<boolean | UrlTree> | Observable<boolean | UrlTree> | boolean | UrlTree =
          false;
        canMatch() {
          return this.result;
        }
      }

      it('falls back to second route when canMatch returns false', fakeAsync(() => {
        const router = TestBed.inject(Router);
        router.resetConfig([
          {
            path: 'a',
            canMatch: [() => coreInject(ConfigurableGuard).canMatch()],
            component: BlankCmp,
          },
          {path: 'a', component: SimpleCmp},
        ]);
        const fixture = createRoot(router, RootCmp);

        router.navigateByUrl('/a');
        advance(fixture);
        expect(fixture.nativeElement.innerHTML).toContain('simple');
      }));

      it('uses route when canMatch returns true', fakeAsync(() => {
        const router = TestBed.inject(Router);
        TestBed.inject(ConfigurableGuard).result = Promise.resolve(true);
        router.resetConfig([
          {
            path: 'a',
            canMatch: [() => coreInject(ConfigurableGuard).canMatch()],
            component: SimpleCmp,
          },
          {path: 'a', component: BlankCmp},
        ]);
        const fixture = createRoot(router, RootCmp);

        router.navigateByUrl('/a');
        advance(fixture);
        expect(fixture.nativeElement.innerHTML).toContain('simple');
      }));

      it('can return UrlTree from canMatch guard', fakeAsync(() => {
        const router = TestBed.inject(Router);
        TestBed.inject(ConfigurableGuard).result = Promise.resolve(
          router.createUrlTree(['/team/1']),
        );
        router.resetConfig([
          {
            path: 'a',
            canMatch: [() => coreInject(ConfigurableGuard).canMatch()],
            component: SimpleCmp,
          },
          {path: 'team/:id', component: TeamCmp},
        ]);
        const fixture = createRoot(router, RootCmp);

        router.navigateByUrl('/a');
        advance(fixture);
        expect(fixture.nativeElement.innerHTML).toContain('team');
      }));

      it('can return UrlTree from CanMatchFn guard', fakeAsync(() => {
        const canMatchTeamSection = new InjectionToken('CanMatchTeamSection');
        const canMatchFactory: (router: Router) => CanMatchFn = (router: Router) => () =>
          router.createUrlTree(['/team/1']);

        TestBed.overrideProvider(canMatchTeamSection, {
          useFactory: canMatchFactory,
          deps: [Router],
        });

        const router = TestBed.inject(Router);

        router.resetConfig([
          {path: 'a', canMatch: [canMatchTeamSection], component: SimpleCmp},
          {path: 'team/:id', component: TeamCmp},
        ]);
        const fixture = createRoot(router, RootCmp);

        router.navigateByUrl('/a');
        advance(fixture);
        expect(fixture.nativeElement.innerHTML).toContain('team');
      }));

      it('runs canMatch guards provided in lazy module', fakeAsync(() => {
        const router = TestBed.inject(Router);
        @Component({
          selector: 'lazy',
          template: 'lazy-loaded-parent [<router-outlet></router-outlet>]',
          standalone: false,
        })
        class ParentLazyLoadedComponent {}

        @Component({
          selector: 'lazy',
          template: 'lazy-loaded-child',
          standalone: false,
        })
        class ChildLazyLoadedComponent {}
        @Injectable()
        class LazyCanMatchFalse {
          canMatch() {
            return false;
          }
        }
        @Component({
          template: 'restricted',
          standalone: false,
        })
        class Restricted {}
        @NgModule({
          declarations: [ParentLazyLoadedComponent, ChildLazyLoadedComponent, Restricted],
          providers: [LazyCanMatchFalse],
          imports: [
            RouterModule.forChild([
              {
                path: 'loaded',
                canMatch: [LazyCanMatchFalse],
                component: Restricted,
                children: [{path: 'child', component: Restricted}],
              },
              {
                path: 'loaded',
                component: ParentLazyLoadedComponent,
                children: [{path: 'child', component: ChildLazyLoadedComponent}],
              },
            ]),
          ],
        })
        class LoadedModule {}

        const fixture = createRoot(router, RootCmp);

        router.resetConfig([{path: 'lazy', loadChildren: () => LoadedModule}]);
        router.navigateByUrl('/lazy/loaded/child');
        advance(fixture);

        expect(TestBed.inject(Location).path()).toEqual('/lazy/loaded/child');
        expect(fixture.nativeElement).toHaveText('lazy-loaded-parent [lazy-loaded-child]');
      }));

      it('cancels guard execution when a new navigation happens', fakeAsync(() => {
        @Injectable({providedIn: 'root'})
        class DelayedGuard {
          static delayedExecutions = 0;
          canMatch() {
            return of(true).pipe(
              delay(1000),
              tap(() => {
                DelayedGuard.delayedExecutions++;
              }),
            );
          }
        }
        const router = TestBed.inject(Router);
        const delayedGuardSpy = spyOn(TestBed.inject(DelayedGuard), 'canMatch');
        delayedGuardSpy.and.callThrough();
        const configurableMatchSpy = spyOn(TestBed.inject(ConfigurableGuard), 'canMatch');
        configurableMatchSpy.and.callFake(() => {
          router.navigateByUrl('/team/1');
          return false;
        });
        router.resetConfig([
          {path: 'a', canMatch: [ConfigurableGuard, DelayedGuard], component: SimpleCmp},
          {path: 'a', canMatch: [ConfigurableGuard, DelayedGuard], component: SimpleCmp},
          {path: 'a', canMatch: [ConfigurableGuard, DelayedGuard], component: SimpleCmp},
          {path: 'team/:id', component: TeamCmp},
        ]);
        const fixture = createRoot(router, RootCmp);

        router.navigateByUrl('/a');
        advance(fixture);
        expect(fixture.nativeElement.innerHTML).toContain('team');

        expect(configurableMatchSpy.calls.count()).toEqual(1);

        // The delayed guard should not execute the delayed condition because the other guard
        // initiates a new navigation, which cancels the current one and unsubscribes from
        // intermediate results.
        expect(DelayedGuard.delayedExecutions).toEqual(0);
        // The delayed guard should still have executed once because guards are executed at the
        // same time
        expect(delayedGuardSpy.calls.count()).toEqual(1);
      }));
    });

    it('should allow guards as functions', fakeAsync(() => {
      @Component({
        template: '',
      })
      class BlankCmp {}
      const router = TestBed.inject(Router);
      const fixture = createRoot(router, RootCmp);
      const guards = {
        canActivate() {
          return true;
        },
        canDeactivate() {
          return true;
        },
        canActivateChild() {
          return true;
        },
        canMatch() {
          return true;
        },
        canLoad() {
          return true;
        },
      };
      spyOn(guards, 'canActivate').and.callThrough();
      spyOn(guards, 'canActivateChild').and.callThrough();
      spyOn(guards, 'canDeactivate').and.callThrough();
      spyOn(guards, 'canLoad').and.callThrough();
      spyOn(guards, 'canMatch').and.callThrough();
      router.resetConfig([
        {
          path: '',
          component: BlankCmp,
          loadChildren: () => [{path: '', component: BlankCmp}],
          canActivate: [guards.canActivate],
          canActivateChild: [guards.canActivateChild],
          canLoad: [guards.canLoad],
          canDeactivate: [guards.canDeactivate],
          canMatch: [guards.canMatch],
        },
        {
          path: 'other',
          component: BlankCmp,
        },
      ]);

      router.navigateByUrl('/');
      advance(fixture);
      expect(guards.canMatch).toHaveBeenCalled();
      expect(guards.canLoad).toHaveBeenCalled();
      expect(guards.canActivate).toHaveBeenCalled();
      expect(guards.canActivateChild).toHaveBeenCalled();

      router.navigateByUrl('/other');
      advance(fixture);
      expect(guards.canDeactivate).toHaveBeenCalled();
    }));

    it('should allow DI in plain function guards', fakeAsync(() => {
      @Component({
        template: '',
      })
      class BlankCmp {}

      @Injectable({providedIn: 'root'})
      class State {
        value = true;
      }
      const router = TestBed.inject(Router);
      const fixture = createRoot(router, RootCmp);
      const guards = {
        canActivate() {
          return coreInject(State).value;
        },
        canDeactivate() {
          return coreInject(State).value;
        },
        canActivateChild() {
          return coreInject(State).value;
        },
        canMatch() {
          return coreInject(State).value;
        },
        canLoad() {
          return coreInject(State).value;
        },
      };
      spyOn(guards, 'canActivate').and.callThrough();
      spyOn(guards, 'canActivateChild').and.callThrough();
      spyOn(guards, 'canDeactivate').and.callThrough();
      spyOn(guards, 'canLoad').and.callThrough();
      spyOn(guards, 'canMatch').and.callThrough();
      router.resetConfig([
        {
          path: '',
          component: BlankCmp,
          loadChildren: () => [{path: '', component: BlankCmp}],
          canActivate: [guards.canActivate],
          canActivateChild: [guards.canActivateChild],
          canLoad: [guards.canLoad],
          canDeactivate: [guards.canDeactivate],
          canMatch: [guards.canMatch],
        },
        {
          path: 'other',
          component: BlankCmp,
        },
      ]);

      router.navigateByUrl('/');
      advance(fixture);
      expect(guards.canMatch).toHaveBeenCalled();
      expect(guards.canLoad).toHaveBeenCalled();
      expect(guards.canActivate).toHaveBeenCalled();
      expect(guards.canActivateChild).toHaveBeenCalled();

      router.navigateByUrl('/other');
      advance(fixture);
      expect(guards.canDeactivate).toHaveBeenCalled();
    }));

    it('can run functional guards serially', fakeAsync(() => {
      function runSerially(
        guards: CanActivateFn[] | CanActivateChildFn[],
      ): CanActivateFn | CanActivateChildFn {
        return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
          const injector = coreInject(EnvironmentInjector);
          const observables = guards.map((guard) => {
            const guardResult = injector.runInContext(() => guard(route, state));
            return wrapIntoObservable(guardResult).pipe(first());
          });
          return concat(...observables).pipe(
            takeWhile((v) => v === true),
            last(),
          );
        };
      }

      const guardDone: string[] = [];

      const guard1: CanActivateFn = () =>
        of(true).pipe(
          delay(100),
          tap(() => guardDone.push('guard1')),
        );
      const guard2: CanActivateFn = () => of(true).pipe(tap(() => guardDone.push('guard2')));
      const guard3: CanActivateFn = () =>
        of(true).pipe(
          delay(50),
          tap(() => guardDone.push('guard3')),
        );
      const guard4: CanActivateFn = () =>
        of(true).pipe(
          delay(200),
          tap(() => guardDone.push('guard4')),
        );
      const router = TestBed.inject(Router);
      router.resetConfig([
        {
          path: '**',
          component: BlankCmp,
          canActivate: [runSerially([guard1, guard2, guard3, guard4])],
        },
      ]);
      router.navigateByUrl('');

      tick(100);
      expect(guardDone).toEqual(['guard1', 'guard2']);
      tick(50);
      expect(guardDone).toEqual(['guard1', 'guard2', 'guard3']);
      tick(200);
      expect(guardDone).toEqual(['guard1', 'guard2', 'guard3', 'guard4']);
    }));
  });
}
