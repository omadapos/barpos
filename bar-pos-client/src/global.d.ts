export {};

export type ThermalPrintResult = { ok: true } | { ok: false; error?: string };

declare global {
  interface Window {
    electronEnv?: {
      NODE_ENV: string;
      isElectron: boolean;
      /** URL de la API en build de producción (Electron file://). */
      apiBaseUrl?: string;
      closeWindow: () => void;
      printThermalReceipt?: (data: {
        config: Record<string, unknown>;
        payload: Record<string, unknown>;
      }) => Promise<ThermalPrintResult>;
      listThermalPrinters?: () => Promise<
        { name: string; displayName?: string; description?: string; isDefault?: boolean }[]
      >;
      /** Windows: COM detectados (USB-serie). Vacío en web u otros SO. */
      listComPorts?: () => Promise<string[]>;
    };
  }
}
