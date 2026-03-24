// src/data/fermenters.ts — Beergate v3 Commercial Fermenter Catalog
export interface FermenterSpec {
  id: string
  name: string
  brand: string
  capacity_liters: number
  material: 'stainless' | 'plastic' | 'pet' | 'glass'
  type: 'conical' | 'bucket' | 'carboy' | 'unitank' | 'pressure'
  pressure_rated: boolean
  max_psi?: number
  features: string[]
  sensor_ports: string[]
  color: string
  icon: string
}

export const FERMENTER_CATALOG: FermenterSpec[] = [
  {
    id: 'fermzilla-27',
    name: 'FermZilla 27L Gen 2',
    brand: 'KegLand',
    capacity_liters: 27,
    material: 'pet',
    type: 'pressure',
    pressure_rated: true,
    max_psi: 35,
    features: ['Pressure rated', 'Conical bottom', 'Floating dip tube', 'Dump valve'],
    sensor_ports: ['Thermowell', 'PRV port'],
    color: '#4A9BD9',
    icon: '🧪',
  },
  {
    id: 'fermzilla-55',
    name: 'FermZilla 55L Gen 2',
    brand: 'KegLand',
    capacity_liters: 55,
    material: 'pet',
    type: 'pressure',
    pressure_rated: true,
    max_psi: 35,
    features: ['Pressure rated', 'Conical bottom', 'Floating dip tube', 'Dump valve'],
    sensor_ports: ['Thermowell', 'PRV port'],
    color: '#4A9BD9',
    icon: '🧪',
  },
  {
    id: 'fermzilla-allrounder',
    name: 'FermZilla All Rounder',
    brand: 'KegLand',
    capacity_liters: 30,
    material: 'pet',
    type: 'pressure',
    pressure_rated: true,
    max_psi: 35,
    features: ['Pressure rated', 'Wide mouth', 'Modular collection container'],
    sensor_ports: ['Thermowell'],
    color: '#4A9BD9',
    icon: '🧫',
  },
  {
    id: 'ss-brewbucket',
    name: 'Brew Bucket',
    brand: 'SS Brewtech',
    capacity_liters: 26.5,
    material: 'stainless',
    type: 'bucket',
    pressure_rated: false,
    features: ['Stainless steel', 'Conical bottom', 'Rotating racking arm', 'Thermometer'],
    sensor_ports: ['Thermowell', 'Racking port'],
    color: '#C0C0C0',
    icon: '🪣',
  },
  {
    id: 'ss-chronical',
    name: 'Chronical Fermenter 7 gal',
    brand: 'SS Brewtech',
    capacity_liters: 26.5,
    material: 'stainless',
    type: 'conical',
    pressure_rated: false,
    features: ['Full conical', 'Chilling coil compatible', 'Butterfly valves', 'TC fittings'],
    sensor_ports: ['Thermowell', 'TC port', 'Sample port'],
    color: '#C0C0C0',
    icon: '🔬',
  },
  {
    id: 'grainfather-conical',
    name: 'Conical Fermenter Pro',
    brand: 'Grainfather',
    capacity_liters: 30,
    material: 'stainless',
    type: 'conical',
    pressure_rated: true,
    max_psi: 14.5,
    features: ['Dual valve', 'Pressure transfer', 'Wireless controller compatible'],
    sensor_ports: ['Thermowell', 'Pressure gauge'],
    color: '#B8860B',
    icon: '⚗️',
  },
  {
    id: 'spike-flex',
    name: 'Flex Fermenter',
    brand: 'Spike Brewing',
    capacity_liters: 30,
    material: 'stainless',
    type: 'conical',
    pressure_rated: false,
    features: ['Conical bottom', 'TC fittings', 'Lid clamp'],
    sensor_ports: ['Thermowell', 'TC port'],
    color: '#A8A8A8',
    icon: '🏗️',
  },
  {
    id: 'spike-flex-plus',
    name: 'Flex+ Fermenter',
    brand: 'Spike Brewing',
    capacity_liters: 30,
    material: 'stainless',
    type: 'unitank',
    pressure_rated: true,
    max_psi: 15,
    features: ['Unitank capable', 'Pressure rated', 'TC fittings', 'Carbonation stone'],
    sensor_ports: ['Thermowell', 'TC port', 'PRV port'],
    color: '#A8A8A8',
    icon: '🏭',
  },
  {
    id: 'brewtools-f40',
    name: 'F40 Unitank',
    brand: 'Brewtools',
    capacity_liters: 40,
    material: 'stainless',
    type: 'unitank',
    pressure_rated: true,
    max_psi: 14.5,
    features: ['Unitank', 'Glycol jacket', 'TC fittings', 'CIP spray ball'],
    sensor_ports: ['Thermowell', 'Glycol ports', 'TC ports'],
    color: '#B0B0B0',
    icon: '🏭',
  },
  {
    id: 'plastic-30l',
    name: 'Cubo fermentador 30L',
    brand: 'Genérico',
    capacity_liters: 30,
    material: 'plastic',
    type: 'bucket',
    pressure_rated: false,
    features: ['Grifo', 'Airlock', 'Económico'],
    sensor_ports: [],
    color: '#F5F5DC',
    icon: '🪣',
  },
  {
    id: 'glass-carboy-25l',
    name: 'Damajuana 25L',
    brand: 'Genérico',
    capacity_liters: 25,
    material: 'glass',
    type: 'carboy',
    pressure_rated: false,
    features: ['Vidrio', 'Observación visual', 'Sin sabor residual'],
    sensor_ports: [],
    color: '#E0F0E0',
    icon: '🫙',
  },
]

// Device types supported in Beergate IoT Hub
export interface DeviceSpec {
  id: string
  type: DeviceType
  name: string
  brand: string
  connectivity: 'wifi' | 'bluetooth' | 'usb' | 'zigbee'
  metrics: string[]
  description: string
  icon: string
}

export type DeviceType = 'hydrometer' | 'temp_controller' | 'airlock' | 'sensor' | 'voice_assistant'

export const SUPPORTED_DEVICES: DeviceSpec[] = [
  {
    id: 'ispindel',
    type: 'hydrometer',
    name: 'iSpindel',
    brand: 'DIY / Community',
    connectivity: 'wifi',
    metrics: ['gravity', 'temperature', 'angle', 'battery'],
    description: 'Hidrómetro WiFi de código abierto. Mide densidad, temperatura y ángulo de inclinación.',
    icon: '📡',
  },
  {
    id: 'tilt',
    type: 'hydrometer',
    name: 'Tilt Hydrometer',
    brand: 'Tilt',
    connectivity: 'bluetooth',
    metrics: ['gravity', 'temperature'],
    description: 'Hidrómetro Bluetooth flotante. Transmite densidad y temperatura al móvil.',
    icon: '🎯',
  },
  {
    id: 'rapt-pill',
    type: 'hydrometer',
    name: 'RAPT Pill',
    brand: 'KegLand',
    connectivity: 'wifi',
    metrics: ['gravity', 'temperature'],
    description: 'Hidrómetro WiFi con transmisión directa a la nube.',
    icon: '💊',
  },
  {
    id: 'plaato-airlock',
    type: 'airlock',
    name: 'Plaato Airlock',
    brand: 'Plaato',
    connectivity: 'wifi',
    metrics: ['co2_activity', 'temperature'],
    description: 'Monitor de actividad CO₂ con sensor de temperatura integrado.',
    icon: '🫧',
  },
  {
    id: 'inkbird-308',
    type: 'temp_controller',
    name: 'ITC-308',
    brand: 'Inkbird',
    connectivity: 'wifi',
    metrics: ['temperature', 'heating_cooling_state'],
    description: 'Controlador de temperatura con calefacción y refrigeración.',
    icon: '🌡️',
  },
  {
    id: 'esp32-sensor',
    type: 'sensor',
    name: 'ESP32 Custom Sensor',
    brand: 'DIY',
    connectivity: 'wifi',
    metrics: ['temperature', 'humidity', 'pressure'],
    description: 'Sensor personalizado basado en ESP32. Extensible con firmware propio.',
    icon: '🔧',
  },
]
