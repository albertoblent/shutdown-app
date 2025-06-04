interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installButton: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));
    window.addEventListener('appinstalled', this.handleAppInstalled.bind(this));
  }

  private handleBeforeInstallPrompt(e: BeforeInstallPromptEvent): void {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    this.deferredPrompt = e;
    // Update UI to notify the user they can install the PWA
    this.showInstallButton();
  }

  private handleAppInstalled(): void {
    // Hide the app-provided install promotion
    this.hideInstallButton();
    // Clear the deferredPrompt so it can be garbage collected
    this.deferredPrompt = null;
    console.log('PWA was installed');
  }

  private showInstallButton(): void {
    if (this.installButton) {
      this.installButton.style.display = 'block';
    }
  }

  private hideInstallButton(): void {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  public setInstallButton(button: HTMLElement): void {
    this.installButton = button;
    if (this.deferredPrompt) {
      this.showInstallButton();
    } else {
      this.hideInstallButton();
    }
  }

  public async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    // Show the install prompt
    await this.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt = null;
    
    return outcome === 'accepted';
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  public isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           'standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true;
  }
}

export const pwaInstaller = new PWAInstaller();