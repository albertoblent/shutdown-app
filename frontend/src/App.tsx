import { useState, useEffect, lazy, Suspense } from 'react';
import { getHabitsSorted } from './features/habits/api/storage';

// Lazy load heavy components
const HabitManager = lazy(() => import('./features/habits').then(m => ({ default: m.HabitManager })));
const Dashboard = lazy(() => import('./features/dashboard').then(m => ({ default: m.Dashboard })));
import styles from './App.module.css';

type AppView = 'dashboard' | 'manage';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [hasHabits, setHasHabits] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if habits exist to determine initial view
  useEffect(() => {
    const checkHabits = () => {
      const result = getHabitsSorted();
      const habitsExist = result.success && (result.data?.length || 0) > 0;
      setHasHabits(habitsExist);

      // Always start with dashboard view - let Dashboard handle empty state
      setCurrentView('dashboard');
      setIsLoading(false);
    };

    checkHabits();
  }, []);

  // Handle navigation
  const handleManageHabits = () => {
    setCurrentView('manage');
  };

  const handleBackToDashboard = () => {
    // Check if habits exist before going back to dashboard
    const result = getHabitsSorted();
    const habitsExist = result.success && (result.data?.length || 0) > 0;

    if (habitsExist) {
      setHasHabits(true);
      setCurrentView('dashboard');
    }
  };

  // Handle when habits are updated
  const handleHabitsChange = () => {
    const hadHabits = hasHabits;
    const result = getHabitsSorted();
    const habitsExist = result.success && (result.data?.length || 0) > 0;
    setHasHabits(habitsExist);

    // If habits were just created (transition from no habits to some), switch to dashboard
    if (!hadHabits && habitsExist) {
      setCurrentView('dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={styles.logo}
            disabled={!hasHabits}
          >
            <svg className={styles.logoIcon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12">
                <path d="m50 10v35"/>
                <path d="m26 20c-29 28-10 70 25 70 28 0 38-23 38-38s-8-26-15-32"/>
              </g>
            </svg>
            Shutdown Routine
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
          {currentView === 'dashboard' ? (
            <Dashboard onManageHabits={handleManageHabits} />
          ) : (
            <HabitManager onHabitsChange={handleHabitsChange} onBackToDashboard={handleBackToDashboard} />
          )}
        </Suspense>
      </main>
    </div>
  )
}

export default App
