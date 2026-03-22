// frontend/src/App.tsx
import React, { lazy, Suspense } from 'react'
import { createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { RouterProvider } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { AppShell } from '@/components/layout/app-shell'

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/pages/login'))
const RegisterPage = lazy(() => import('@/pages/register'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const InventoryPage = lazy(() => import('@/pages/inventory'))
const BrewingPage = lazy(() => import('@/pages/brewing'))
const FermentationPage = lazy(() => import('@/pages/fermentation'))
const RecipesPage = lazy(() => import('@/pages/recipes'))
const ShopPage = lazy(() => import('@/pages/shop'))
const SettingsPage = lazy(() => import('@/pages/settings'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-48">
    <div className="flex flex-col items-center gap-3">
      <span className="text-4xl animate-pulse">🍺</span>
      <p className="text-sm text-text-secondary">Cargando...</p>
    </div>
  </div>
)

function requireAuth() {
  const isAuthenticated = useAuthStore.getState().isAuthenticated
  if (!isAuthenticated) throw redirect({ to: '/login' })
}

function requireGuest() {
  const isAuthenticated = useAuthStore.getState().isAuthenticated
  if (isAuthenticated) throw redirect({ to: '/' })
}

// Root route
const rootRoute = createRootRoute({ component: Outlet })

// Auth routes (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: requireGuest,
  component: () => <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  beforeLoad: requireGuest,
  component: () => <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>,
})

// App layout route (protected)
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: requireAuth,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: () => <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>,
})

const inventoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/inventory',
  component: () => <Suspense fallback={<PageLoader />}><InventoryPage /></Suspense>,
})

const brewingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/brewing',
  component: () => <Suspense fallback={<PageLoader />}><BrewingPage /></Suspense>,
})

const fermentationRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/fermentation',
  component: () => <Suspense fallback={<PageLoader />}><FermentationPage /></Suspense>,
})

const recipesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/recipes',
  component: () => <Suspense fallback={<PageLoader />}><RecipesPage /></Suspense>,
})

const shopRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/shop',
  component: () => <Suspense fallback={<PageLoader />}><ShopPage /></Suspense>,
})

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings',
  component: () => <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  appRoute.addChildren([
    indexRoute,
    inventoryRoute,
    brewingRoute,
    fermentationRoute,
    recipesRoute,
    shopRoute,
    settingsRoute,
  ]),
])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadDelay: 100,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { accessToken, user, brewery, setAuth, logout } = useAuthStore()
  const [ready, setReady] = React.useState(!!user)

  React.useEffect(() => {
    if (accessToken && !user) {
      api.get<{ user: import('@/lib/types').User; brewery: import('@/lib/types').Brewery | null }>('/v1/auth/me/full')
        .then((data) => {
          // Keep existing tokens, just add user+brewery
          useAuthStore.setState({
            user: data.user,
            brewery: data.brewery ?? null,
          })
        })
        .catch(() => logout())
        .finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [accessToken, user, logout])

  if (!ready) return <PageLoader />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthBootstrap>
      <RouterProvider router={router} />
    </AuthBootstrap>
  )
}
