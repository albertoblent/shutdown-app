import { useState, useEffect } from 'react';
import { HabitManager } from './features/habits';
import { Dashboard } from './features/dashboard';
import { getHabitsSorted } from './features/habits/api/storage';
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
      
      // If no habits exist, show habit management
      if (!habitsExist) {
        setCurrentView('manage');
      }
      
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
    const result = getHabitsSorted();
    const habitsExist = result.success && (result.data?.length || 0) > 0;
    setHasHabits(habitsExist);
    
    // If habits were just created, switch to dashboard
    if (habitsExist && currentView === 'manage') {
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
        {currentView === 'dashboard' && hasHabits ? (
          <Dashboard onManageHabits={handleManageHabits} />
        ) : (
          <>
            <section className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>
                {hasHabits ? 'Manage Your Habits' : 'Daily Shutdown Routine'}
              </h1>
              <p className={styles.welcomeSubtitle}>
                {hasHabits 
                  ? 'Add, edit, or remove habits from your daily routine.'
                  : 'Build healthy habits and end your day with intention. Track your progress and create a meaningful routine.'
                }
              </p>
              {hasHabits && (
                <button onClick={handleBackToDashboard} className={styles.backButton}>
                  ← Back to Dashboard
                </button>
              )}
            </section>

            <section className={styles.habitSection}>
              <HabitManager onHabitsChange={handleHabitsChange} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
