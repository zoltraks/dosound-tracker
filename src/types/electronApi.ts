export type ElectronApi = {
  onAppCloseRequested?: (handler: () => void) => void;
  removeAppCloseRequestedListener?: (handler: () => void) => void;
  confirmAppClose?: () => void;
  cancelAppClose?: () => void;
  getRuntimeInfo?: () => {
    runtime?: string;
    electron?: string;
    node?: string;
    chrome?: string;
  } | null;
};

export type ExtendedWindow = Window & {
  electronAPI?: ElectronApi;
  __dosoundTrackerIsResetting?: boolean;
};
