export type ThermalConnection = 'tcp' | 'com';

export interface ThermalPrinterSettings {
  /** Imprimir automáticamente al confirmar cobro */
  printOnPay: boolean;
  connection: ThermalConnection;
  tcpHost: string;
  tcpPort: number;
  /** USB vía driver serie: COM3, COM4… (Administrador de dispositivos → Puertos) */
  comPort: string;
  /** EPSON: mayoría 80 mm chinas; STAR: algunas marcas */
  driver: 'EPSON' | 'STAR';
  /** Caracteres por línea (48 típico en 80 mm) */
  width: 48 | 42 | 56;
  /** Nombre del local en el ticket */
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  /** Texto final del ticket (agradecimiento) */
  footerThanks: string;
}

const STORAGE_KEY = 'barpos-thermal-config';

export const defaultThermalSettings: ThermalPrinterSettings = {
  printOnPay: true,
  connection: 'tcp',
  tcpHost: '192.168.0.100',
  tcpPort: 9100,
  comPort: 'COM3',
  driver: 'EPSON',
  width: 48,
  businessName: 'nfarra2',
  businessAddress: '127 Maverik St',
  businessPhone: '6178748644',
  footerThanks: '¡Gracias por su visita!',
};

export function loadThermalSettings(): ThermalPrinterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultThermalSettings };
    const parsed = JSON.parse(raw) as Partial<ThermalPrinterSettings>;
    return { ...defaultThermalSettings, ...parsed };
  } catch {
    return { ...defaultThermalSettings };
  }
}

export function saveThermalSettings(
  partial: Partial<ThermalPrinterSettings>
): ThermalPrinterSettings {
  const next = { ...loadThermalSettings(), ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/** Configuración que espera el proceso principal de Electron */
export function toElectronPrintConfig(s: ThermalPrinterSettings) {
  return {
    connection: s.connection,
    tcpHost: s.tcpHost,
    tcpPort: s.tcpPort,
    comPort: s.comPort,
    driver: s.driver,
    width: s.width,
  };
}
