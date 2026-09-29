/**
 * Premium Luxury Cinematic Automotive Configuration
 * Pure editorial automotive luxury
 */
const scenes = [
  {
    id: "exterior",
    index: 0,
    stageIndex: 0,
    number: "01",
    category: "01 / EXTERIOR",
    title: "THE MACHINE",
    quote: "Designed to be noticed.",
    videoKey: "car",
    video: "/videos/01-car.mp4",
    detail: "Sculpted silhouette engineered for effortless presence.",
  },
  {
    id: "experience",
    index: 1,
    stageIndex: 1,
    number: "02",
    category: "02 / EXPERIENCE",
    title: "THE EXPERIENCE",
    quote: "Meet the machine.",
    videoKey: "woman",
    video: "/videos/02-woman.mp4",
    detail: "An intimate synergy between driver and grand tourer.",
  },
  {
    id: "performance",
    index: 2,
    stageIndex: 2,
    number: "03",
    category: "03 / PERFORMANCE",
    title: "PERFORMANCE",
    quote: "Power meets precision.",
    videoKey: "engine",
    video: "/videos/03-engine.mp4",
    detail: "Power calibrated for uncompromised grand touring.",
    specs: [
      { label: "POWER", value: "000 HP" },
      { label: "TORQUE", value: "000 Nm" },
      { label: "DRIVE", value: "AWD" },
    ],
  },
  {
    id: "interior",
    index: 3,
    stageIndex: 3,
    number: "04",
    category: "04 / INTERIOR",
    title: "THE CABIN",
    quote: "Step inside.",
    videoKey: "interior",
    video: "/videos/04-interior.mp4",
    detail: "Hand-stitched sanctuary enveloped in acoustic calm.",
    endCta: {
      headline: "THE NEW EXPERIENCE",
      subheadline: "Made to move you.",
      buttonText: "EXPLORE THE CAR",
    },
  },
];

export const carConfig = {
  name: "AURELIA",
  series: "GT BESPOKE",
  year: "2026",

  videos: {
    car: "/videos/01-car.mp4",
    woman: "/videos/02-woman.mp4",
    engine: "/videos/03-engine.mp4",
    interior: "/videos/04-interior.mp4",
  },

  // Premium specifications - easily configurable without inventing real values
  performance: {
    power: "000 HP",
    torque: "000 Nm",
    drive: "AWD",
  },

  navItems: [
    { id: "exterior", index: 0, stageIndex: 0, label: "EXTERIOR", shortLabel: "EXTERIOR", number: "01" },
    { id: "experience", index: 1, stageIndex: 1, label: "EXPERIENCE", shortLabel: "EXPERIENCE", number: "02" },
    { id: "performance", index: 2, stageIndex: 2, label: "PERFORMANCE", shortLabel: "PERFORMANCE", number: "03" },
    { id: "interior", index: 3, stageIndex: 3, label: "INTERIOR", shortLabel: "INTERIOR", number: "04" },
  ],

  scenes,
  stages: scenes,

  exploreData: {
    description:
      "Every curve honed in aerodynamic computational wind tunnels. Every surface clad in bespoke semi-aniline leather and satin open-pore carbon weave.",
    telemetry: [
      { label: "POWER", value: "000 HP" },
      { label: "TORQUE", value: "000 Nm" },
      { label: "DRIVETRAIN", value: "INTELLIGENT AWD" },
      { label: "ACCELERATION", value: "0–100 KM/H IN 3.2S" },
      { label: "TOP SPEED", value: "325 KM/H (202 MPH)" },
      { label: "CHASSIS", value: "CARBON-ALUMINUM MONOCOQUE" },
    ],
  },

  specifications: {
    engine: "4.0L Twin-Turbocharged V8 with Mild Hybrid Boost",
    transmission: "9-Speed Dual-Clutch Sequential Transmission",
    acceleration: "0 – 100 km/h in 3.2s",
    topSpeed: "325 km/h (202 mph)",
    curbWeight: "1,740 kg / 3,836 lbs",
    chassis: "Carbon-Aluminum Composite Monocoque",
    suspension: "Adaptive Multi-Chamber Air Suspension with Predictive Road Scan",
    audioSystem: "23-Speaker Bespoke 3D Diamond Surround Sound",
  },

  features: [
    {
      code: "AERO-01",
      title: "Active Morphing Aero",
      desc: "Front active air slats and variable carbon spoiler generating instantaneous downforce.",
    },
    {
      code: "DRIVE-02",
      title: "Predictive Torque AWD",
      desc: "Millisecond-level power vectoring delivering unwavering grip across all atmospheric conditions.",
    },
    {
      code: "CABIN-03",
      title: "Bespoke Sanctuary Cockpit",
      desc: "Semi-aniline leather, open-pore ash wood, and double-glazed acoustic laminated glass.",
    },
  ],
};