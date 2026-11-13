/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeView } from './views/HomeView';
import { StudentView } from './views/StudentView';
import { TeacherView } from './views/TeacherView';

type AppRoute = 'home' | 'guru' | 'siswa';

function parseRouteFromPath(pathname: string): AppRoute {
  const normalized = pathname.toLowerCase();
  if (normalized.startsWith('/guru')) return 'guru';
  if (normalized.startsWith('/siswa')) return 'siswa';
  return 'home';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseRouteFromPath(window.location.pathname) : 'home'
  );

  const navigate = useCallback((target: AppRoute) => {
    const nextPath = target === 'home' ? '/' : `/${target}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setRoute(target);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRouteFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <ErrorBoundary>
      {route === 'guru' ? (
        <TeacherView onNavigate={navigate} />
      ) : route === 'siswa' ? (
        <StudentView onNavigate={navigate} />
      ) : (
        <HomeView onNavigate={navigate} />
      )}
    </ErrorBoundary>
  );
}
