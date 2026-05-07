export type ThermalConnection = 'tcp' | 'com';
export type PrintStationKey = 'bar' | 'kitchen';

export interface StationPrinterSettings {
  enabled: boolean;
  connection: ThermalConnection;
  tcpHost: string;
  tcpPort: number;
  /** USB via driver serie: COM3, COM4... */
  comPort: string;
  /** EPSON: mayoria 80 mm chinas; STAR: algunas marcas */
  driver: 'EPSON' | 'STAR';
  /** Caracteres por linea (48 tipico en 80 mm) */
  width: 48 | 42 | 56;
}

export interface ThermalPrinterSettings {
  /** Imprimir automaticamente al confirmar cobro */
  printOnPay: boolean;
  connection: ThermalConnection;
  tcpHost: string;
  tcpPort: number;
  /** USB via driver serie: COM3, COM4... */
  comPort: string;
  /** EPSON: mayoria 80 mm chinas; STAR: algunas marcas */
  driver: 'EPSON' | 'STAR';
  /** Caracteres por linea (48 tipico en 80 mm) */
  width: 48 | 42 | 56;
  /** Nombre del local en el ticket */
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  /** Texto final del ticket (agradecimiento) */
  footerThanks: string;
  /** Impresoras separadas para comandas de barra / cocina */
  stationPrinters: Record<PrintStationKey, StationPrinterSettings>;
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
  footerThanks: 'Gracias por su visita!',
  stationPrinters: {
    bar: {
      enabled: false,
      connection: 'tcp',
      tcpHost: '192.168.0.101',
      tcpPort: 9100,
      comPort: 'COM4',
      driver: 'EPSON',
      width: 48,
    },
    kitchen: {
      enabled: false,
      connection: 'tcp',
      tcpHost: '192.168.0.102',
      tcpPort: 9100,
      comPort: 'COM5',
      driver: 'EPSON',
      width: 48,
    },
  },
};

function mergeSettings(parsed: Partial<ThermalPrinterSettings>): ThermalPrinterSettings {
  return {
    ...defaultThermalSettings,
    ...parsed,
    stationPrinters: {
      bar: {
        ...defaultThermalSettings.stationPrinters.bar,
        ...(parsed.stationPrinters?.bar ?? {}),
      },
      kitchen: {
        ...defaultThermalSettings.stationPrinters.kitchen,
        ...(parsed.stationPrinters?.kitchen ?? {}),
      },
    },
  };
}

export function loadThermalSettings(): ThermalPrinterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return mergeSettings({});
    const parsed = JSON.parse(raw) as Partial<ThermalPrinterSettings>;
    return mergeSettings(parsed);
  } catch {
    return mergeSettings({});
  }
}

export function saveThermalSettings(
  partial: Partial<ThermalPrinterSettings>
): ThermalPrinterSettings {
  const next = mergeSettings({ ...loadThermalSettings(), ...partial });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/** Configuracion que espera el proceso principal de Electron */
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

export function toStationElectronPrintConfig(
  s: ThermalPrinterSettings,
  station: PrintStationKey
) {
  const p = s.stationPrinters[station];
  return {
    connection: p.connection,
    tcpHost: p.tcpHost,
    tcpPort: p.tcpPort,
    comPort: p.comPort,
    driver: p.driver,
    width: p.width,
  };
}
