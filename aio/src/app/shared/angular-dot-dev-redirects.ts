/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

const linksMap = new Map<string, string>([
  ['docs', 'overview'],
  ['resources', 'https://devlibrary.withgoogle.com/products/angular?sort=added'],
  ['guide/what-is-angular', 'overview'],
  ['start', 'tutorials/learn-angular'],
  ['start/start-routing', 'tutorials/learn-angular/12-enable-routing'],
  ['start/start-data', 'tutorials/learn-angular/19-creating-an-injectable-service'],
  ['start/start-forms', 'tutorials/learn-angular/15-forms'],
  ['start/start-deployment', 'tools/cli/deployment'],
  ['api/animations', 'api#animations'],
  ['api/animations/browser', 'api#animations-browser'],
  ['api/animations/browser/testing', 'api#animations-browser-testing'],
  ['api/common', 'api#common'],
  ['api/common/http', 'api#common-http'],
  ['api/common/http/testing', 'api#common-http-testing'],
  ['api/common/testing', 'api#common-testing'],
  ['api/common/upgrade', 'api#common-upgrade'],
  ['api/core', 'api#core'],
  ['api/core/for', 'api/core/@for'],
  ['api/core/if', 'api/core/@if'],
  ['api/core/switch', 'api/core/@switch'],
  ['api/core/defer', 'api/core/@defer'],
  ['api/core/rxjs-interop', 'api#core-rxjs-interop'],
  ['api/core/testing', 'api#core-testing'],
  ['api/elements', 'api#elements'],
  ['api/forms', 'api#forms'],
  ['api/localize', 'api#localize'],
  ['api/platform-browser', 'api#platform-browser'],
  ['api/platform-browser/animations', 'api#platform-browser-animations'],
  ['api/platform-browser/animations/async', 'api#platform-browser-animations-async'],
  ['api/platform-browser-dynamic', 'api#platform-browser-dynamic'],
  ['api/platform-browser-dynamic/testing', 'api#platform-browser-dynamic-testing'],
  ['api/platform-server', 'api#platform-server'],
  ['api/platform-server/testing', 'api#platform-server-testing'],
  ['api/router', 'api#router'],
  ['api/router/testing', 'api#router-testing'],
  ['api/router/upgrade', 'api#router-upgrade'],
  ['api/service-worker', 'api#service-worker'],
  ['api/upgrade/static', 'api#upgrade-static'],
  ['api/upgrade/static/testing', 'api#upgrade-static-testing'],
  ['guide/setup-local', 'tools/cli/setup-local'],
  ['guide/understanding-angular-overview', 'overview'],
  ['guide/component-overview', 'guide/components'],
  ['guide/lifecycle-hooks', 'guide/components/lifecycle'],
  ['guide/view-encapsulation', 'guide/components/styling'],
  ['guide/component-interaction', 'guide/components/inputs'],
  ['guide/component-styles', 'guide/components/styling'],
  ['guide/inputs-outputs', 'guide/components/inputs'],
  ['guide/content-projection', 'guide/components/content-projection'],
  ['guide/dynamic-component-loader', 'guide/components/programmatic-rendering'],
  ['guide/template-overview', 'guide/templates'],
  ['guide/template-syntax', 'guide/templates'],
  ['guide/interpolation', 'guide/templates/interpolation'],
  ['guide/template-statements', 'guide/templates/template-statements'],
  ['guide/binding-overview', 'guide/templates/binding'],
  ['guide/property-binding', 'guide/templates/property-binding'],
  ['guide/attribute-binding', 'guide/templates/attribute-binding'],
  ['guide/class-binding', 'guide/templates/class-binding'],
  ['guide/event-binding', 'guide/templates/event-binding'],
  ['guide/two-way-binding', 'guide/templates/two-way-binding'],
  ['guide/control_flow', 'guide/templates/control-flow'],
  ['guide/pipes-overview', 'guide/pipes'],
  ['guide/pipe-template', 'guide/pipes/template'],
  ['guide/pipes-transform-data', 'guide/pipes/transform-data'],
  ['guide/pipe-precedence', 'guide/pipes/precedence'],
  ['guide/template-reference-variables', 'guide/templates/reference-variables'],
  ['guide/svg-in-templates', 'guide/templates/svg-in-templates'],
  ['guide/built-in-directives', 'guide/directives'],
  ['guide/attribute-directives', 'guide/directives/attribute-directives'],
  ['guide/structural-directives', 'guide/directives/structural-directives'],
  ['guide/directive-composition-api', 'guide/directives/directive-composition-api'],
  ['guide/dependency-injection-overview', 'guide/di'],
  ['guide/dependency-injection', 'guide/di/dependency-injection'],
  ['guide/creating-injectable-service', 'guide/di/creating-injectable-service'],
  ['guide/dependency-injection-providers', 'guide/di/dependency-injection-providers'],
  ['guide/dependency-injection-context', 'guide/di/dependency-injection-context'],
  ['guide/hierarchical-dependency-injection', 'guide/di/hierarchical-dependency-injection'],
  ['guide/developer-guide-overview', 'overview'],
  ['guide/standalone-components', 'guide/components/importing'],
  ['guide/standalone-migration', 'reference/migrations/standalone'],
  ['guide/change-detection', 'best-practices/runtime-performance'],
  ['guide/change-detection-zone-pollution', 'best-practices/zone-pollution'],
  ['guide/change-detection-slow-computations', 'best-practices/slow-computations'],
  ['guide/change-detection-skipping-subtrees', 'best-practices/skipping-subtrees'],
  ['guide/routing-overview', 'guide/routing'],
  ['guide/router', 'guide/routing/common-router-tasks'],
  ['guide/router-tutorial', 'guide/routing/router-tutorial'],
  ['guide/routing-with-urlmatcher', 'guide/routing/routing-with-urlmatcher'],
  ['guide/router-tutorial-toh', 'tutorials/learn-angular'],
  ['guide/router-reference', 'guide/routing/router-reference'],
  ['guide/forms-overview', 'guide/forms'],
  ['guide/reactive-forms', 'guide/forms/reactive-forms'],
  ['guide/typed-forms', 'guide/forms/typed-forms'],
  ['guide/form-validation', 'guide/forms/form-validation'],
  ['guide/dynamic-form', 'guide/forms/dynamic-forms'],
  ['guide/esbuild', 'tools/cli/build-system-migration'],
  ['guide/understanding-communicating-with-http', 'guide/http'],
  ['guide/http-setup-server-communication', 'guide/http/setup'],
  ['guide/http-request-data-from-server', 'guide/http/making-requests'],
  ['guide/http-make-jsonp-request', 'guide/http/making-requests'],
  ['guide/http-handle-request-errors', 'guide/http/making-requests'],
  ['guide/http-send-data-to-server', 'guide/http/making-requests'],
  ['guide/http-configure-http-url-parameters', 'guide/http/making-requests'],
  ['guide/http-intercept-requests-and-responses', 'guide/http/interceptors'],
  ['guide/http-interceptor-use-cases', 'guide/http/interceptors'],
  ['guide/http-pass-metadata-to-interceptors', 'guide/http/interceptors'],
  ['guide/http-track-show-request-progress', 'guide/http/interceptors'],
  ['guide/http-optimize-server-interaction', 'guide/http/interceptors'],
  ['guide/http-security-xsrf-protection', 'best-practices/security'],
  ['guide/http-test-requests', 'guide/http/testing'],
  ['guide/security', 'best-practices/security'],
  ['guide/image-directive', 'guide/image-optimization'],
  ['guide/testing-code-coverage', 'guide/testing/code-coverage'],
  ['guide/testing-services', 'guide/testing/services'],
  ['guide/testing-components-basics', 'guide/testing/components-basics'],
  ['guide/testing-components-scenarios', 'guide/testing/components-scenarios'],
  ['guide/testing-attribute-directives', 'guide/testing/attribute-directives'],
  ['guide/testing-pipes', 'guide/testing/pipes'],
  ['guide/test-debugging', 'guide/testing/debugging'],
  ['guide/testing-utility-apis', 'guide/testing/utility-apis'],
  ['guide/i18n-overview', 'guide/i18n'],
  ['guide/i18n-common-overview', 'guide/i18n'],
  ['guide/i18n-common-add-package', 'guide/i18n/add-package'],
  ['guide/i18n-common-locale-id', 'guide/i18n/locale-id'],
  ['guide/i18n-common-format-data-locale', 'guide/i18n/format-data-locale'],
  ['guide/i18n-common-prepare', 'guide/i18n/prepare'],
  ['guide/i18n-common-translation-files', 'guide/i18n/translation-files'],
  ['guide/i18n-common-merge', 'guide/i18n/merge'],
  ['guide/i18n-common-deploy', 'guide/i18n/deploy'],
  ['guide/i18n-example', 'guide/i18n/example'],
  ['guide/i18n-optional-overview', 'guide/i18n'],
  ['guide/i18n-optional-import-global-variants', 'guide/i18n/import-global-variants'],
  ['guide/i18n-optional-manage-marked-text', 'guide/i18n/manage-marked-text'],
  ['guide/animations', 'guide/animations'],
  ['guide/transition-and-triggers', 'guide/animations/transition-and-triggers'],
  ['guide/complex-animation-sequences', 'guide/animations/complex-sequences'],
  ['guide/reusable-animations', 'guide/animations/reusable-animations'],
  ['guide/route-animations', 'guide/animations/route-animations'],
  ['guide/service-worker-intro', 'ecosystem/service-workers'],
  ['guide/service-worker-getting-started', 'ecosystem/service-workers/getting-started'],
  ['guide/app-shell', 'ecosystem/service-workers/app-shell'],
  ['guide/service-worker-communications', 'ecosystem/service-workers/communications'],
  ['guide/service-worker-notifications', 'ecosystem/service-workers/push-notifications'],
  ['guide/service-worker-devops', 'ecosystem/service-workers/devops'],
  ['guide/service-worker-config', 'ecosystem/service-workers/config'],
  ['guide/web-worker', 'ecosystem/web-workers'],
  ['guide/universal', 'guide/ssr'],
  ['guide/prerendering', 'guide/prerendering'],
  ['guide/libraries', 'tools/libraries'],
  ['guide/using-libraries', 'tools/libraries/using-libraries'],
  ['guide/creating-libraries', 'tools/libraries/creating-libraries'],
  ['guide/angular-package-format', 'tools/libraries/angular-package-format'],
  ['guide/rxjs-interop', 'guide/signals/rxjs-interop'],
  ['guide/accessibility', 'best-practices/a11y'],
  ['guide/updating', 'update'],
  ['guide/property-binding-best-practices', 'guide/templates/property-binding-best-practices'],
  ['guide/lazy-loading-ngmodules', 'guide/ngmodules/lazy-loading'],
  ['guide/lightweight-injection-tokens', 'guide/di/lightweight-injection-tokens'],
  ['guide/devtools', 'tools/devtools'],
  ['guide/deployment', 'tools/cli/deployment'],
  ['guide/aot-compiler', 'tools/cli/aot-compiler'],
  ['guide/angular-compiler-options', 'reference/configs/angular-compiler-options'],
  ['guide/aot-metadata-errors', 'tools/cli/aot-metadata-errors'],
  ['guide/template-typecheck', 'tools/cli/template-typecheck'],
  ['guide/build', 'tools/cli/build'],
  ['guide/cli-builder', 'tools/cli/cli-builder'],
  ['guide/language-service', 'tools/language-service'],
  ['guide/schematics', 'tools/cli/schematics'],
  ['guide/schematics-authoring', 'tools/cli/schematics-authoring'],
  ['guide/schematics-for-libraries', 'tools/cli/schematics-for-libraries'],
  ['guide/signal-inputs', 'guide/signals/inputs'],
  ['guide/model-inputs', 'guide/signals/model'],
  ['guide/signal-queries', 'guide/signals/queries'],
  ['tutorial/first-app/first-app-lesson-01', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-02', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-03', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-04', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-05', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-06', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-07', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-08', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-09', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-10', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-11', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-12', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-13', 'tutorials/first-app'],
  ['tutorial/first-app/first-app-lesson-14', 'tutorials/first-app'],
  ['tutorial/tour-of-heroes', 'tutorials/learn-angular'],
  ['tutorial/tour-of-heroes/toh-pt0', 'tutorials/learn-angular'],
  ['tutorial/tour-of-heroes/toh-pt1', 'tutorials/learn-angular'],
  ['tutorial/tour-of-heroes/toh-pt2', 'tutorials/learn-angular'],
  ['tutorial/tour-of-heroes/toh-pt3', 'tutorials/learn-angular'],
  ['tutorial/tour-of-heroes/toh-pt4', 'tutorials/learn-angular'],
  ['tutorial/tour-of-heroes/toh-pt5', 'tutorials/learn-angular'],
  ['tutorial/tour-of-heroes/toh-pt6', 'tutorials/learn-angular'],
  ['guide/update-to-version-16', 'update'],
  ['guide/roadmap', 'roadmap'],
  ['guide/releases', 'reference/releases'],
  ['guide/versions', 'reference/versions'],
  ['guide/browser-support', 'reference/versions#browser-support'],
  ['guide/deprecations', 'reference/releases#deprecation-policy'],
  ['guide/upgrade', 'https://angular.io/guide/upgrade'],
  ['guide/upgrade-setup', 'https://angular.io/guide/upgrade'],
  ['guide/upgrade-performance', 'https://angular.io/guide/upgrade'],
  ['guide/ajs-quick-reference', 'https://angular.io/guide/upgrade'],
  ['guide/architecture', 'overview'],
  ['guide/architecture-modules', 'guide/ngmodules'],
  ['guide/architecture-components', 'guide/components'],
  ['guide/architecture-services', 'guide/di'],
  ['guide/architecture-next-steps', 'overview'],
  ['guide/binding-syntax', 'guide/templates/binding'],
  ['guide/event-binding-concepts', 'guide/templates/event-binding'],
  ['guide/template-reference-variables', 'guide/templates/reference-variables'],
  ['guide/file-structure', 'reference/configs/file-structure'],
  ['guide/workspace-config', 'reference/configs/workspace-config'],
  ['guide/npm-packages', 'reference/configs/npm-packages'],
  ['guide/typescript-configuration', 'reference/configs/angular-compiler-options'],
  ['guide/strict-mode', 'tools/cli/template-typecheck#strict-mode'],
  ['guide/ngmodules', 'guide/ngmodules'],
  ['guide/ngmodules-vs-jsmodule', 'guide/ngmodules'],
  ['guide/bootstrapping', 'guide/ngmodules/bootstrapping'],
  ['guide/frequent-ngmodules', 'guide/ngmodules/frequent'],
  ['guide/module-types', 'guide/ngmodules/module-types'],
  ['guide/feature-modules', 'guide/ngmodules/feature-modules'],
  ['guide/providers', 'guide/ngmodules/providers'],
  ['guide/singleton-services', 'guide/ngmodules/singleton-services'],
  ['guide/sharing-ngmodules', 'guide/ngmodules/sharing'],
  ['guide/ngmodule-api', 'guide/ngmodules/api'],
  ['guide/universal-ngmodule', 'guide/ngmodules/universal'],
  ['guide/ngmodule-faq', 'guide/ngmodules/faq'],
  ['guide/observables', 'guide/pipes/unwrapping-data-observables'],
  ['guide/rx-library', 'guide/signals/rxjs-interop'],
  ['guide/observables-in-angular', 'guide/signals/rxjs-interop'],
  ['guide/practical-observable-usage', 'guide/signals/rxjs-interop'],
  ['guide/comparing-observables', 'guide/signals/rxjs-interop'],
  ['guide/dependency-injection-in-action', 'guide/di/di-in-action'],
  ['guide/example-apps-list', 'docs'],
  ['guide/glossary', 'docs'],
  ['guide/cheatsheet', 'docs'],
  ['guide/styleguide', 'style-guide'],
  [
    'guide/contributors-guide-overview',
    'https://github.com/angular/angular/blob/main/CONTRIBUTING.md',
  ],
  ['guide/doc-tasks', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/reviewing-content', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  [
    'guide/updating-search-keywords',
    'https://github.com/angular/angular/blob/main/CONTRIBUTING.md',
  ],
  ['guide/doc-update-overview', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/doc-prepare-to-edit', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/doc-select-issue', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/doc-update-start', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/doc-editing', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/docs-lint-errors', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/doc-build-test', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/doc-pr-prep', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/doc-pr-open', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/doc-pr-update', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/doc-edit-finish', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/docs-style-guide', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/localizing-angular', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['guide/localized-documentation', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
  ['cli', 'tools/cli'],
  ['presskit', 'press-kit'],
  ['contribute', 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md'],
]);

const AIO_URL = 'https://angular.io';
const ADEV_URL = 'https://angular.dev/';
const URL_PREFIX = 'https:/';

const normalizePath = (path: string): string => {
  if (path[0] === '/') {
    return path.substring(1);
  }
  return path;
};

export function rewriteLink(aioLink: string): string {
  const link = aioLink.replace(`${AIO_URL}`, '');

  const linkWithoutFragment = normalizePath(link).split('#')[0];
  const newPath = linksMap.get(linkWithoutFragment) ?? linkWithoutFragment;

  if (newPath.startsWith(URL_PREFIX)) {
      return newPath;
  }
  return ADEV_URL + newPath;
}
