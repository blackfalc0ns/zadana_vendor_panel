import { routes } from './app.routes';

describe('app routes', () => {
  it('lazy-loads the auth entry routes', () => {
    const loginRoute = routes.find((route) => route.path === 'login');
    const registerRoute = routes.find((route) => route.path === 'register');
    const onboardingRoute = routes.find((route) => route.path === 'onboarding');

    expect(loginRoute?.loadComponent).toEqual(jasmine.any(Function));
    expect(registerRoute?.loadComponent).toEqual(jasmine.any(Function));
    expect(onboardingRoute?.loadComponent).toEqual(jasmine.any(Function));
  });

  it('lazy-loads dashboard inside the secured layout tree', () => {
    const layoutRoute = routes.find((route) => route.path === '');
    const dashboardRoute = layoutRoute?.children?.find((route) => route.path === 'dashboard');

    expect(dashboardRoute?.loadComponent).toEqual(jasmine.any(Function));
  });
});
