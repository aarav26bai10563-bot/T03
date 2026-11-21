import {
  MonitoringStatus,
  VerificationStatus,
  WaterbodyCategory,
  WaterbodyRecord,
} from '../types/monitoring';
import { DIRECTORY_TRADITIONAL_TERMS } from './traditionalTerms';

export const NAMED_WATERBODY_TARGET_COUNT = 242;
export const TRADITIONAL_TERMS_TARGET_COUNT = 83;
export { DIRECTORY_TRADITIONAL_TERMS };

function generateEllipticalRing(
  lat: number,
  lng: number,
  areaHa: number,
  eccentricity = 1.3,
  rotationDeg = 20,
  shrinkRatio = 1,
  offsetLat = 0,
  offsetLng = 0
): [number, number][] {
  const areaKm2 = Math.max(areaHa / 100, 0.04) * shrinkRatio;
  const radiusKm = Math.sqrt(areaKm2 / Math.PI);
  const clampedKm = Math.min(Math.max(radiusKm, 0.25), 14);
  const latDegPerKm = 1 / 110.574;
  const lngDegPerKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));
  const rot = (rotationDeg * Math.PI) / 180;

  const points: [number, number][] = [];
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const organicWave =
      1 + 0.14 * Math.sin(theta * 3 + 0.5) + 0.08 * Math.cos(theta * 5);
    const localX = clampedKm * eccentricity * organicWave * Math.cos(theta);
    const localY = (clampedKm / eccentricity) * organicWave * Math.sin(theta);

    const rotX = localX * Math.cos(rot) - localY * Math.sin(rot);
    const rotY = localX * Math.sin(rot) + localY * Math.cos(rot);

    points.push([
      Number((lat + offsetLat + rotY * latDegPerKm).toFixed(5)),
      Number((lng + offsetLng + rotX * lngDegPerKm).toFixed(5)),
    ]);
  }
  return points;
}

interface VerifiedOverlayMeta {
  alternative_names: string[];
  state: string;
  district: string;
  waterbody_category: WaterbodyCategory;
  latitude: number;
  longitude: number;
  historical_area: number;
  recent_area: number;
  monitoring_status: MonitoringStatus;
  verification_status: VerificationStatus;
  historicalPeriod: string;
  recentPeriod: string;
  resolutionNote: string;
  hydrologyNotes: string;
  rotationDeg: number;
  eccentricity: number;
}

// Verified DEMO geographic & hydrological overlays keyed by exact directory name
const VERIFIED_DEMO_METADATA: Record<string, VerifiedOverlayMeta> = {
  'Bellandur Lake': {
    alternative_names: ['Bellandur Kere'],
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    waterbody_category: 'Natural lake',
    latitude: 12.9369,
    longitude: 77.6708,
    historical_area: 362,
    recent_area: 214,
    monitoring_status: 'Severe Recession',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: '10m Sentinel-2 detectable; aquatic weed cover can obscure open water boundary.',
    hydrologyNotes: 'Urban catchment lake showing persistent eastern shoreline encroachment and dry-season shrinkage.',
    rotationDeg: 15,
    eccentricity: 1.5,
  },
  'Sambhar Salt Lake': {
    alternative_names: ['Sambhar Jheel'],
    state: 'Rajasthan',
    district: 'Jaipur',
    waterbody_category: 'Wetland',
    latitude: 26.9261,
    longitude: 75.0861,
    historical_area: 19400,
    recent_area: 8650,
    monitoring_status: 'Severe Recession',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Post-Monsoon (Demo)',
    recentPeriod: 'Q1 2025 Pre-Monsoon (Demo)',
    resolutionNote: 'Large saline playa; salt crust reflectance requires SAR + NDWI cross-verification.',
    hydrologyNotes: 'Pronounced seasonal contraction between post-monsoon peak and pre-monsoon evaporation.',
    rotationDeg: -22,
    eccentricity: 1.75,
  },
  'Hussain Sagar': {
    alternative_names: ['Tank Bund Lake'],
    state: 'Telangana',
    district: 'Hyderabad',
    waterbody_category: 'Reservoir',
    latitude: 17.4239,
    longitude: 78.4738,
    historical_area: 570,
    recent_area: 458,
    monitoring_status: 'Moderate Loss',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Well resolved at 10m; urban shoreline embankments stabilize western perimeter.',
    hydrologyNotes: 'Moderate northern inflow siltation and gradual surface reduction along shallow margins.',
    rotationDeg: 40,
    eccentricity: 1.25,
  },
  'Chilika Lake': {
    alternative_names: ['Chilika Lagoon'],
    state: 'Odisha',
    district: 'Puri',
    waterbody_category: 'Wetland',
    latitude: 19.7955,
    longitude: 85.4422,
    historical_area: 24500,
    recent_area: 23450,
    monitoring_status: 'Stable',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Brackish coastal lagoon; periodic tidal flux causes minor edge variation.',
    hydrologyNotes: 'Surface extent remains close to historical reference with seasonal monsoon expansion.',
    rotationDeg: 35,
    eccentricity: 1.6,
  },
  'Vembanad Lake': {
    alternative_names: ['Vembanad Kayal', 'Punnamada Lake'],
    state: 'Kerala',
    district: 'Alappuzha',
    waterbody_category: 'Wetland',
    latitude: 9.6054,
    longitude: 76.4046,
    historical_area: 14200,
    recent_area: 11380,
    monitoring_status: 'Moderate Loss',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Frequent monsoon cloud cover requires Sentinel-1 SAR radar supplementation.',
    hydrologyNotes: 'Paddy reclamation margins and hyacinth mats reduce open-water signature in summer.',
    rotationDeg: 80,
    eccentricity: 1.9,
  },
  Bhojtal: {
    alternative_names: ['Upper Lake', 'Bada Talab'],
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    waterbody_category: 'Reservoir',
    latitude: 23.2528,
    longitude: 77.3436,
    historical_area: 3180,
    recent_area: 2510,
    monitoring_status: 'Moderate Loss',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Clear optical signature; western shallow inlet recedes markedly in pre-monsoon.',
    hydrologyNotes: 'Primary drinking water reservoir showing exposed western mudflats prior to monsoon.',
    rotationDeg: 10,
    eccentricity: 1.8,
  },
  'Chembarambakkam Lake': {
    alternative_names: ['Chembarambakkam Eri'],
    state: 'Tamil Nadu',
    district: 'Kancheepuram',
    waterbody_category: 'Reservoir',
    latitude: 13.0114,
    longitude: 80.0598,
    historical_area: 2550,
    recent_area: 1840,
    monitoring_status: 'Watch',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: '10m optical imagery tracks storage drawdown reliably in dry months.',
    hydrologyNotes: 'Northeast monsoon dependence drives steep summer drawdown along northern bund.',
    rotationDeg: -15,
    eccentricity: 1.35,
  },
  'Dal Lake': {
    alternative_names: ['Srinagar Dal'],
    state: 'Jammu & Kashmir',
    district: 'Srinagar',
    waterbody_category: 'Natural lake',
    latitude: 34.1135,
    longitude: 74.8529,
    historical_area: 1820,
    recent_area: 1410,
    monitoring_status: 'Moderate Loss',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Floating gardens and dense macrophytes complicate pure NDWI classification.',
    hydrologyNotes: 'Open-water channel width reduced along peripheral marshland belts.',
    rotationDeg: 55,
    eccentricity: 1.45,
  },
  'Pichola Lake': {
    alternative_names: ['Lake Pichola'],
    state: 'Rajasthan',
    district: 'Udaipur',
    waterbody_category: 'Natural lake',
    latitude: 24.572,
    longitude: 73.679,
    historical_area: 696,
    recent_area: 585,
    monitoring_status: 'Watch',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: '10m Sentinel-2 resolves main basin and island shorelines clearly.',
    hydrologyNotes: 'Seasonal southern feeder recession visible during late winter and spring.',
    rotationDeg: 85,
    eccentricity: 1.6,
  },
  'Deepor Beel': {
    alternative_names: ['Dipor Bil'],
    state: 'Assam',
    district: 'Kamrup Metropolitan',
    waterbody_category: 'Wetland',
    latitude: 26.1292,
    longitude: 91.6489,
    historical_area: 920,
    recent_area: 545,
    monitoring_status: 'Severe Recession',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Heavy monsoon cloud cover requires Sentinel-1 SAR backscatter thresholding.',
    hydrologyNotes: 'Ramsar floodplain wetland facing acute dry-season contraction along eastern boundary.',
    rotationDeg: 20,
    eccentricity: 1.5,
  },
  'Nal Sarovar': {
    alternative_names: ['Nalsarovar Wetland'],
    state: 'Gujarat',
    district: 'Ahmedabad',
    waterbody_category: 'Wetland',
    latitude: 22.7854,
    longitude: 72.0365,
    historical_area: 12080,
    recent_area: 6240,
    monitoring_status: 'Severe Recession',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Shallow seasonal depth leads to rapid surface area contraction in dry years.',
    hydrologyNotes: 'Substantial ghost shoreline ring exposed across eastern and southern shallow beds.',
    rotationDeg: -30,
    eccentricity: 1.4,
  },
  'Harike Wetland': {
    alternative_names: ['Hari-ke-Pattan'],
    state: 'Punjab',
    district: 'Tarn Taran',
    waterbody_category: 'Wetland',
    latitude: 31.1486,
    longitude: 74.9612,
    historical_area: 4100,
    recent_area: 3920,
    monitoring_status: 'Stable',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Barrage-regulated confluence; aquatic vegetation requires seasonal NDWI tuning.',
    hydrologyNotes: 'Confluence water levels remain relatively consistent across winter observations.',
    rotationDeg: 30,
    eccentricity: 1.55,
  },
  'Kanwar Lake': {
    alternative_names: ['Kabar Taal', 'Kabartal Wetland'],
    state: 'Bihar',
    district: 'Begusarai',
    waterbody_category: 'Wetland',
    latitude: 25.6305,
    longitude: 86.1436,
    historical_area: 2620,
    recent_area: 1180,
    monitoring_status: 'Severe Recession',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Oxbow floodplain lake; agricultural cropping encroaches on seasonal water margins.',
    hydrologyNotes: 'Over 50% dry-season surface loss observed between post-monsoon flood and spring.',
    rotationDeg: -45,
    eccentricity: 1.65,
  },
  'Sukhna Lake': {
    alternative_names: ['Sukhna Cho Reservoir'],
    state: 'Chandigarh',
    district: 'Chandigarh',
    waterbody_category: 'Reservoir',
    latitude: 30.7421,
    longitude: 76.8188,
    historical_area: 228,
    recent_area: 179,
    monitoring_status: 'Moderate Loss',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: '10m resolution detects northern siltation delta expansion reliably.',
    hydrologyNotes: 'Shivalik foothill silt deposition reduces eastern shallow storage pocket.',
    rotationDeg: 5,
    eccentricity: 1.4,
  },
  'Loktak Lake': {
    alternative_names: ['Phumdis Lake'],
    state: 'Manipur',
    district: 'Bishnupur',
    waterbody_category: 'Wetland',
    latitude: 24.5579,
    longitude: 93.8147,
    historical_area: 28700,
    recent_area: 23600,
    monitoring_status: 'Watch',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Floating phumdi biomass requires SAR + optical separation of open water.',
    hydrologyNotes: 'Largest freshwater wetland in Northeast India with shifting phumdi mats.',
    rotationDeg: 70,
    eccentricity: 1.5,
  },
  'Wular Lake': {
    alternative_names: ['Volur'],
    state: 'Jammu & Kashmir',
    district: 'Bandipora',
    waterbody_category: 'Natural lake',
    latitude: 34.3667,
    longitude: 74.5667,
    historical_area: 13000,
    recent_area: 8900,
    monitoring_status: 'Moderate Loss',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Seasonal snowmelt inflow shifts open water extent between spring and autumn.',
    hydrologyNotes: 'Siltation and willow plantation encroachment along marsh periphery.',
    rotationDeg: -20,
    eccentricity: 1.45,
  },
  'Lonar Lake': {
    alternative_names: ['Lonar Crater Lake'],
    state: 'Maharashtra',
    district: 'Buldhana',
    waterbody_category: 'Natural lake',
    latitude: 19.9758,
    longitude: 76.5069,
    historical_area: 113,
    recent_area: 108,
    monitoring_status: 'Stable',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Circular crater rim sharply defines open water boundary at 10m resolution.',
    hydrologyNotes: 'Endorheic saline-alkaline crater lake showing minimal perimeter variation.',
    rotationDeg: 0,
    eccentricity: 1.05,
  },
  'Gobind Sagar': {
    alternative_names: ['Bhakra Reservoir'],
    state: 'Himachal Pradesh',
    district: 'Bilaspur',
    waterbody_category: 'Reservoir',
    latitude: 31.4253,
    longitude: 76.4728,
    historical_area: 16800,
    recent_area: 14100,
    monitoring_status: 'Watch',
    verification_status: 'Verified',
    historicalPeriod: '2016-2018 Baseline (Demo)',
    recentPeriod: 'Q1 2025 Observation (Demo)',
    resolutionNote: 'Deep canyon reservoir; steep valley walls limit lateral drawdown width.',
    hydrologyNotes: 'Sutlej snowmelt and monsoon regulation govern seasonal surface changes.',
    rotationDeg: -50,
    eccentricity: 1.9,
  },
};

// Exact 242 Named Lakes and Water Bodies (entries 1-242, original spellings preserved)
const RAW_NAMED_LIST: string[] = [
  'Adambakkam Lake',
  'Ameenpur Lake',
  'Anchar Lake',
  'Ana Sagar Lake',
  'Anshupa Lake',
  'Ashtamudi Lake',
  'Bahour Lake',
  'Bakhira Tal',
  'Badkhal Lake',
  'Balsamand Lake',
  'Barua Sagar Tal',
  'Bellandur Lake',
  'Belasagar Lake',
  'Bhalswa Lake',
  'Bhadrakali Lake',
  'Bhimtal Lake',
  'Bhindawas Lake',
  'Bijoy Sagar',
  'Blue Bird Lake',
  'Bhojtal',
  'Brahma Sarovar',
  'Brari Nambal',
  'Bhrigu Lake',
  'Chandra Taal',
  'Chandubi Lake',
  'Chander Naun',
  'Chembarambakkam Lake',
  'Chilika Lake',
  'Cumbum Lake',
  'Dal Lake',
  'Damdama Lake',
  'Damodar Kund',
  'Dashair Lake',
  'Dehnasar Lake',
  'Deepor Beel',
  'Deoria Tal',
  'Dhebar Lake',
  'Dhankar Lake',
  'Dilthaman Tank',
  'Dimna Lake',
  'Durgam Cheruvu',
  'East Calcutta Wetlands',
  'Emerald Lake',
  'Fateh Sagar Lake',
  'Fox Sagar Lake',
  'Futala Lake',
  'Gadsar Lake',
  'Gangabal Lake',
  'Gangaram Cheruvu',
  'Ganga Lake',
  'Ghadhasaru Lake',
  'Ghora Katora Lake',
  'Gil Sar',
  'Gobind Sagar',
  'Gobind Vallabh Pant Sagar',
  'Gorewada Lake',
  'Gourisagar Pukhuri',
  'Govardhan Sagar Lake',
  'Gopi Talav',
  'Gurudongmar Lake',
  'Haflong Lake',
  'Hamirsar Lake',
  'Harike Wetland',
  'Hauz Khas Tank',
  'Hesaraghatta Lake',
  'Hebbal Lake',
  'Himayat Sagar',
  'Hokersar',
  'Honnamana Kere',
  'Hussain Sagar',
  'Ikop Pat',
  'Jal Mahal',
  'Jaraganahalli Lake',
  'Joysagar Tank',
  'Jore Pokhri',
  'Kanjia Lake',
  'Kanjli Wetland',
  'Kankaria Lake',
  'Kanwar Lake',
  'Kareri Lake',
  'Karanji Lake',
  'Karna Lake',
  'Kaylana Lake',
  'Keetham Lake',
  'Kedar Tal',
  'Keisampat',
  'Khajjiar Lake',
  'Khindsi Lake',
  'Khecheopalri Lake',
  'Kodaikanal Lake',
  'Kolleru Lake',
  'Kondakarla Ava',
  'Krishansar Lake',
  'Kukkarahalli Lake',
  'Kuttanad Lake',
  'Kyagar Tso',
  'Lake Badi',
  'Lake Cholamu',
  'Lake Foy Sagar',
  'Lake Shilloi',
  'Lake Tsongmo',
  'Lakhota Lake',
  'Lama Dal',
  'Lalbagh Lake',
  'Laphupat',
  'Lingambudhi Lake',
  'Loktak Lake',
  'Loho Lake',
  'Lonar Lake',
  'Loukoipat',
  'Lower Lake, Bhopal',
  'Maanaanchira',
  'Macchial Lake',
  'Maguri Bil',
  'Mahakali Lake',
  'Mamadapur Badshah Lake',
  'Manasbal Lake',
  'Manimahesh Lake',
  'Mansar Lake',
  'Marsar Lake',
  'Mastani Lake',
  'Madiwala Lake',
  'Mayem Lake',
  'Meherun Lake',
  'Mirik Lake',
  'Mirasol Lake',
  'Mir Alam Tank',
  'Moti Jheel',
  'Morikolong Beel',
  'Nallambal Lake',
  'Nako Lake',
  'Nakki Lake',
  'Nal Sarovar',
  'Nanda Lake',
  'Naini Lake',
  'Narayan Sarovar',
  'Nandan Sar Lake',
  'Nigeen Lake',
  'Nilnag Lake',
  'Nundkol Lake',
  'Ooty Lake',
  'Osman Sagar',
  'Ousteri Lake',
  'Padinjarechira',
  'Pakhal Lake',
  'Palak Dil',
  'Pampa Sarovar',
  'Pangong Tso',
  'Paravur Kayal',
  'Pashan Lake',
  'Perumal Eri',
  'Phulhar Lake',
  'Pichola Lake',
  'Pong Dam Lake',
  'Porompat',
  'Powai Lake',
  'Prashar Lake',
  'Pumlenpat',
  'Pushkar Lake',
  'Puttenahalli Lake, JP Nagar',
  'Puttenahalli Lake, Yelahanka',
  'Rabindra Sarobar',
  'Rajsamand Lake',
  'Ramappa Lake',
  'Ramgarh Lake',
  'Ramgarh Tal',
  'Ranchi Lake',
  'Rankala Lake',
  'Rasikbil',
  'Red Hills Lake',
  'Renuka Lake',
  'Rewalsar Lake',
  'Roopkund Lake',
  'Ropar Wetland',
  'Rudrasagar Lake',
  'Sangaipat',
  'Sannihit Sarovar',
  'Sanjay Lake',
  'Saromanaha Beel',
  'Saroornagar Lake',
  'Sarsai Jheel',
  'Samaguri Beel',
  'Samiti Lake',
  'Sambhar Salt Lake',
  'Sardar Sarovar',
  'Satsar Lake',
  'Silsako Lake',
  'Siliserh Lake',
  'Singanallur Lake',
  'Sivasagar Tank',
  'Sukhna Lake',
  'Sulekere',
  'Suraj Tal',
  'Surajkund',
  'Surha Tal',
  'Swaroop Sagar Lake',
  'Shasthamkotta Lake',
  'Shamirpet Lake',
  'Sheshnag Lake',
  'Shilempat',
  'Shivasagar Lake',
  'Sheetal Jheel',
  'Son Beel',
  'South Lhonak Lake',
  'Subhas Sarobar',
  'Sumendu Lake',
  'Tandi Lake',
  'Talao Pali',
  'Talwara Lake',
  'Tam Dil',
  'Tansa Lake',
  'Tarsar Lake',
  'Tehri Lake',
  'Telibandha Lake',
  'Thangapat',
  'Thol Lake',
  'Tilyar Lake',
  'Tso Kar',
  'Tso Moriri',
  'Tulian Lake',
  'Tulsi Lake',
  'Ukkadam Lake',
  'Ulsoor Lake',
  'Umiam Lake',
  'Ummed Sagar Bandh',
  'Udaisagar Lake',
  'Upvan Lake',
  'Vaitarna Lake',
  'Vanchikulam',
  'Vastrapur Lake',
  'Vadakkechira',
  'Veli Lake',
  'Vembanad Lake',
  'Venna Lake',
  'Veeranam Lake',
  'Vihar Lake',
  'Victoria Sagar Lake',
  'Vivekananda Sarovar',
  'Wular Lake',
  'Yelahanka Lake',
  'Zaimeng Lake',
  'Zeilad Lake',
];

const CATEGORY_OVERRIDES: Record<string, WaterbodyCategory> = {
  'East Calcutta Wetlands': 'Wetland',
  'Harike Wetland': 'Wetland',
  'Kanjli Wetland': 'Wetland',
  'Ropar Wetland': 'Wetland',
  'Deepor Beel': 'Wetland',
  'Maguri Bil': 'Wetland',
  'Morikolong Beel': 'Wetland',
  Rasikbil: 'Wetland',
  'Samaguri Beel': 'Wetland',
  'Saromanaha Beel': 'Wetland',
  'Son Beel': 'Wetland',
  Hokersar: 'Wetland',
  'Ashtamudi Lake': 'Wetland',
  'Chilika Lake': 'Wetland',
  'Vembanad Lake': 'Wetland',
  'Kolleru Lake': 'Wetland',
  'Sambhar Salt Lake': 'Wetland',
  'Nal Sarovar': 'Wetland',
  'Kanwar Lake': 'Wetland',
  'Loktak Lake': 'Wetland',
  Bhojtal: 'Reservoir',
  'Gobind Sagar': 'Reservoir',
  'Gobind Vallabh Pant Sagar': 'Reservoir',
  'Sardar Sarovar': 'Reservoir',
  'Tehri Lake': 'Reservoir',
  'Pong Dam Lake': 'Reservoir',
  'Hussain Sagar': 'Reservoir',
  'Himayat Sagar': 'Reservoir',
  'Osman Sagar': 'Reservoir',
  'Chembarambakkam Lake': 'Reservoir',
  'Ummed Sagar Bandh': 'Reservoir',
  'Perumal Eri': 'Irrigation tank',
  'Durgam Cheruvu': 'Irrigation tank',
  'Gangaram Cheruvu': 'Irrigation tank',
  'Honnamana Kere': 'Irrigation tank',
  'Joysagar Tank': 'Irrigation tank',
  'Sivasagar Tank': 'Irrigation tank',
  'Dilthaman Tank': 'Irrigation tank',
  'Mir Alam Tank': 'Irrigation tank',
  'Hauz Khas Tank': 'Irrigation tank',
  'Brahma Sarovar': 'Temple pond',
  'Sannihit Sarovar': 'Temple pond',
  'Damodar Kund': 'Temple pond',
  'Pampa Sarovar': 'Temple pond',
  'Narayan Sarovar': 'Temple pond',
  Surajkund: 'Temple pond',
  'Gourisagar Pukhuri': 'Village pond',
  'Jore Pokhri': 'Natural pond',
};

function inferClearCategory(name: string): WaterbodyCategory {
  if (CATEGORY_OVERRIDES[name]) return CATEGORY_OVERRIDES[name];
  const lower = name.toLowerCase();
  if (
    lower.includes('wetland') ||
    lower.includes('beel') ||
    lower.includes('bil')
  ) {
    return 'Wetland';
  }
  if (lower.includes('dam') || lower.includes('reservoir')) {
    return 'Reservoir';
  }
  if (lower.includes('eri') || lower.includes('kere') || lower.includes('cheruvu')) {
    return 'Irrigation tank';
  }
  if (lower.includes('kund')) {
    return 'Temple pond';
  }
  if (lower.includes('pukhuri') || lower.includes('pokhri')) {
    return 'Village pond';
  }
  // High-confidence natural lake markers
  if (
    lower.includes('tso') ||
    lower.includes('tal') ||
    lower.includes('taal') ||
    lower.includes('jheel')
  ) {
    return 'Natural lake';
  }
  // Many named Indian "lakes" and "sagars" are man-made tanks/reservoirs or unverified,
  // so mark unverified classifications conservatively per scientific data quality guidelines.
  return 'Other or unverified waterbody';
}

export const DIRECTORY_NAMED_ENTRIES: WaterbodyRecord[] = RAW_NAMED_LIST.map(
  (name, index) => {
    const num = index + 1;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 36);
    const id = `wb-${String(num).padStart(3, '0')}-${slug}`;
    const verified = VERIFIED_DEMO_METADATA[name];

    if (verified) {
      const areaChangePct = Number(
        (
          ((verified.recent_area - verified.historical_area) /
            verified.historical_area) *
          100
        ).toFixed(1)
      );
      const estimated_area_loss = Number(
        (verified.historical_area - verified.recent_area).toFixed(1)
      );
      const shrinkRatio = Math.max(
        0.25,
        verified.recent_area / verified.historical_area
      );

      const historicalPolygon = generateEllipticalRing(
        verified.latitude,
        verified.longitude,
        verified.historical_area,
        verified.eccentricity,
        verified.rotationDeg,
        1
      );
      const recentPolygon = generateEllipticalRing(
        verified.latitude,
        verified.longitude,
        verified.historical_area,
        verified.eccentricity,
        verified.rotationDeg,
        shrinkRatio,
        0.0008,
        -0.0008
      );

      const hist = verified.historical_area;
      const rec = verified.recent_area;

      return {
        id,
        ownerId: 'demo-public',
        name,
        alternative_names: verified.alternative_names,
        entry_type: 'named_waterbody',
        waterbody_category: verified.waterbody_category,
        state: verified.state,
        district: verified.district,
        country: 'India',
        latitude: verified.latitude,
        longitude: verified.longitude,
        historical_area: hist,
        recent_area: rec,
        estimated_area_loss,
        monitoring_status: verified.monitoring_status,
        verification_status: verified.verification_status,
        data_source: 'DEMO Reference Dataset',
        historicalPeriod: verified.historicalPeriod,
        recentPeriod: verified.recentPeriod,
        resolutionNote: verified.resolutionNote,
        hydrologyNotes: verified.hydrologyNotes,
        areaChangePct,
        historicalPolygon,
        recentPolygon,
        seasonalComparison: {
          baselinePreMonsoonHa: Number((hist * 0.84).toFixed(1)),
          preMonsoonHa: Number((rec * 0.88).toFixed(1)),
          monsoonHa: Number(Math.min(hist, rec * 1.24).toFixed(1)),
          postMonsoonHa: Number(Math.min(hist, rec * 1.15).toFixed(1)),
          winterHa: Number(rec.toFixed(1)),
        },
      };
    }

    const inferredCat = inferClearCategory(name);
    const verificationStatus: VerificationStatus =
      inferredCat === 'Other or unverified waterbody'
        ? 'Unverified'
        : 'Partially Verified';

    return {
      id,
      ownerId: 'demo-public',
      name,
      alternative_names: [],
      entry_type: 'named_waterbody',
      waterbody_category: inferredCat,
      state: '',
      district: '',
      country: 'India',
      latitude: null,
      longitude: null,
      historical_area: null,
      recent_area: null,
      estimated_area_loss: null,
      monitoring_status: 'Unmonitored',
      verification_status: verificationStatus,
      data_source: 'India Waterbody Directory (Pending Verification)',
      historicalPeriod: 'Pending baseline',
      recentPeriod: 'Pending observation',
      resolutionNote:
        'Listed in the India Waterbody Directory with original spelling preserved. Coordinates, administrative boundaries, and satellite area measurements await verification.',
      areaChangePct: null,
    };
  }
);
