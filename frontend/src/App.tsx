import { HabitManager } from './features/habits'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <a href="/" className={styles.logo}>
            <svg className={styles.logoIcon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12">
                <path d="m50 10v35"/>
                <path d="m26 20c-29 28-10 70 25 70 28 0 38-23 38-38s-8-26-15-32"/>
              </g>
            </svg>
            Shutdown Routine
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Daily Shutdown Routine
          </h1>
          <p className={styles.welcomeSubtitle}>
            Build healthy habits and end your day with intention. 
            Track your progress and create a meaningful routine.
          </p>
        </section>

        <section className={styles.habitSection}>
          <HabitManager />
        </section>
      </main>
    </div>
  )
}

export default App
