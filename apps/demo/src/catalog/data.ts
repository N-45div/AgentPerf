export type Category = "keyboards" | "mice" | "monitors" | "headsets" | "webcams" | "docks";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  /** One decimal, 0–5. */
  rating: number;
  reviewCount: number;
  inStock: boolean;
  tags: string[];
  shortDescription: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Order {
  number: string;
  name: string;
  email: string;
  lines: Array<{ productId: string; name: string; quantity: number; price: number }>;
  total: number;
}

export const CATEGORIES: Category[] = [
  "keyboards",
  "mice",
  "monitors",
  "headsets",
  "webcams",
  "docks"
];

export type SortBy = "price" | "rating" | "name";

/**
 * Fixed catalog — no clock, no randomness, so every load of this page and
 * every benchmark run see byte-identical inventory.
 *
 * The keyboards are seeded so "cheapest in-stock wireless keyboard rated 4.5+"
 * resolves to exactly one product (Nimbus Air 75, $89.99) while several
 * plausible near-misses sit around it: cheaper wireless boards that are out of
 * stock, a cheaper wireless board rated 4.4, cheaper wired boards rated higher,
 * and equally-rated wireless boards that cost more.
 *
 * The word "keyboard" appears only in the keyboards category, so a text search
 * for "wireless keyboard" is unambiguous.
 */
export const PRODUCTS: Product[] = [
  {
    id: "kb-bluecrest-office104",
    name: "Bluecrest Office 104",
    brand: "Bluecrest",
    category: "keyboards",
    price: 29.99,
    rating: 4.1,
    reviewCount: 812,
    inStock: true,
    tags: ["wired", "full-size", "membrane", "number-pad"],
    shortDescription:
      "Full-size membrane keyboard with a number pad, spill channels and a 1.8 m USB-A cable."
  },
  {
    id: "kb-tessera-click61",
    name: "Tessera Click 61",
    brand: "Tessera",
    category: "keyboards",
    price: 39.99,
    rating: 4.5,
    reviewCount: 1204,
    inStock: true,
    tags: ["wired", "compact", "mechanical", "hot-swap"],
    shortDescription:
      "60% hot-swap mechanical keyboard, USB-C only — no battery, no dongle, tactile switches fitted."
  },
  {
    id: "kb-wren-ripple-slim",
    name: "Wren Ripple Slim",
    brand: "Wren",
    category: "keyboards",
    price: 46.99,
    rating: 4.2,
    reviewCount: 388,
    inStock: true,
    tags: ["wireless", "bluetooth", "low-profile", "multi-device"],
    shortDescription:
      "Low-profile scissor-switch keyboard that pairs to three devices over Bluetooth and runs on AAAs."
  },
  {
    id: "kb-orbit-pebble-mini",
    name: "Orbit Pebble Mini",
    brand: "Orbit",
    category: "keyboards",
    price: 54.99,
    rating: 4.3,
    reviewCount: 651,
    inStock: true,
    tags: ["wireless", "compact", "bluetooth", "travel"],
    shortDescription:
      "Palm-sized 60% travel keyboard in a fabric sleeve; about six weeks of typing per charge."
  },
  {
    id: "kb-anvil-ironclad87",
    name: "Anvil Ironclad 87 TKL",
    brand: "Anvil",
    category: "keyboards",
    price: 64.99,
    rating: 4.8,
    reviewCount: 2140,
    inStock: true,
    tags: ["wired", "tenkeyless", "mechanical", "pbt"],
    shortDescription:
      "Tenkeyless mechanical keyboard on a steel plate with doubleshot PBT caps. Wired only, braided cable."
  },
  {
    id: "kb-corvid-drift84",
    name: "Corvid Drift 84",
    brand: "Corvid",
    category: "keyboards",
    price: 69.99,
    rating: 4.4,
    reviewCount: 517,
    inStock: true,
    tags: ["wireless", "compact", "mechanical", "hot-swap"],
    shortDescription:
      "75% hot-swap wireless keyboard with a 2.4 GHz dongle and Bluetooth. Gasket mount, no backlight."
  },
  {
    id: "kb-kestrel-featherlight65",
    name: "Kestrel Featherlight 65",
    brand: "Kestrel",
    category: "keyboards",
    price: 74.99,
    rating: 4.7,
    reviewCount: 1866,
    inStock: false,
    tags: ["wireless", "compact", "mechanical", "low-latency"],
    shortDescription:
      "65% wireless keyboard on a 1 ms link in a 210 g aluminium frame. Sold out — next batch lands in October."
  },
  {
    id: "kb-sable-nocturne96",
    name: "Sable Nocturne 96",
    brand: "Sable",
    category: "keyboards",
    price: 84.99,
    rating: 4.6,
    reviewCount: 903,
    inStock: false,
    tags: ["wireless", "mechanical", "backlit", "number-pad"],
    shortDescription:
      "96% wireless keyboard that keeps the number pad, with silent linears and a white backlight. Currently sold out."
  },
  {
    id: "kb-nimbus-air75",
    name: "Nimbus Air 75",
    brand: "Nimbus",
    category: "keyboards",
    price: 89.99,
    rating: 4.6,
    reviewCount: 1477,
    inStock: true,
    tags: ["wireless", "mechanical", "hot-swap", "backlit"],
    shortDescription:
      "75% wireless mechanical keyboard: 2.4 GHz dongle plus Bluetooth for two more machines, ~90 hours a charge."
  },
  {
    id: "kb-vantage-loft68",
    name: "Vantage Loft 68",
    brand: "Vantage",
    category: "keyboards",
    price: 92.99,
    rating: 4.5,
    reviewCount: 742,
    inStock: true,
    tags: ["wireless", "compact", "mechanical", "gasket"],
    shortDescription:
      "Gasket-mounted 65% wireless keyboard with a rotary volume knob and per-key lighting."
  },
  {
    id: "kb-halcyon-quietwave",
    name: "Halcyon Quietwave",
    brand: "Halcyon",
    category: "keyboards",
    price: 99.99,
    rating: 4.5,
    reviewCount: 1298,
    inStock: true,
    tags: ["wireless", "silent", "full-size", "ergonomic"],
    shortDescription:
      "Full-size wireless keyboard tuned for shared offices: dampened stabilisers and a padded wrist rest."
  },
  {
    id: "kb-meridian-mx-slim",
    name: "Meridian MX Slim",
    brand: "Meridian",
    category: "keyboards",
    price: 119.99,
    rating: 4.6,
    reviewCount: 3021,
    inStock: true,
    tags: ["wireless", "low-profile", "backlit", "multi-device"],
    shortDescription:
      "Flat wireless keyboard that follows your cursor between three machines and charges over USB-C."
  },
  {
    id: "kb-ironsmith-forge75",
    name: "Ironsmith Forge 75",
    brand: "Ironsmith",
    category: "keyboards",
    price: 159.99,
    rating: 4.8,
    reviewCount: 604,
    inStock: true,
    tags: ["wireless", "mechanical", "aluminium", "hot-swap"],
    shortDescription:
      "CNC aluminium 75% wireless keyboard, foam-filled case, screw-in stabilisers, three connection modes."
  },

  {
    id: "ms-bluecrest-daily3",
    name: "Bluecrest Daily 3",
    brand: "Bluecrest",
    category: "mice",
    price: 12.99,
    rating: 3.9,
    reviewCount: 2210,
    inStock: true,
    tags: ["wired", "ambidextrous", "budget"],
    shortDescription:
      "Plain three-button optical mouse with a 1.5 m cable. The one every stockroom has a drawer of."
  },
  {
    id: "ms-wren-glide-lite",
    name: "Wren Glide Lite",
    brand: "Wren",
    category: "mice",
    price: 19.99,
    rating: 4.0,
    reviewCount: 1043,
    inStock: true,
    tags: ["wireless", "compact", "travel"],
    shortDescription:
      "Pocket-sized 2.4 GHz mouse with the receiver stowed in the battery bay. One AA lasts about a year."
  },
  {
    id: "ms-orbit-drift-m2",
    name: "Orbit Drift M2",
    brand: "Orbit",
    category: "mice",
    price: 24.99,
    rating: 4.3,
    reviewCount: 1580,
    inStock: true,
    tags: ["wireless", "silent-click", "office"],
    shortDescription:
      "Quiet-click office mouse with a rubberised grip and a receiver that also drives an Orbit board."
  },
  {
    id: "ms-tessera-arc-vertical",
    name: "Tessera Arc Vertical",
    brand: "Tessera",
    category: "mice",
    price: 34.99,
    rating: 4.4,
    reviewCount: 786,
    inStock: true,
    tags: ["wireless", "ergonomic", "vertical"],
    shortDescription:
      "57-degree vertical mouse that keeps the forearm neutral. Takes about a week to stop feeling strange."
  },
  {
    id: "ms-corvid-swift90",
    name: "Corvid Swift 90",
    brand: "Corvid",
    category: "mice",
    price: 39.99,
    rating: 4.6,
    reviewCount: 2904,
    inStock: true,
    tags: ["wireless", "lightweight", "gaming"],
    shortDescription:
      "63 g symmetrical shape on a 1 ms link, PTFE feet, no lighting. Charges over USB-C in 40 minutes."
  },
  {
    id: "ms-nimbus-trace-mx",
    name: "Nimbus Trace MX",
    brand: "Nimbus",
    category: "mice",
    price: 44.99,
    rating: 4.5,
    reviewCount: 1332,
    inStock: true,
    tags: ["wireless", "multi-device", "office"],
    shortDescription:
      "Three-machine mouse with a free-spin wheel and copy-paste across desktops on the same account."
  },
  {
    id: "ms-kestrel-talon-pro",
    name: "Kestrel Talon Pro",
    brand: "Kestrel",
    category: "mice",
    price: 54.99,
    rating: 4.7,
    reviewCount: 1988,
    inStock: false,
    tags: ["wireless", "gaming", "low-latency"],
    shortDescription:
      "Competition shape with a 26k sensor and 4 kHz polling. Out of stock; the white finish is due first."
  },
  {
    id: "ms-anvil-grip-ergo",
    name: "Anvil Grip Ergo",
    brand: "Anvil",
    category: "mice",
    price: 59.99,
    rating: 4.4,
    reviewCount: 522,
    inStock: true,
    tags: ["wired", "ergonomic", "large-hands"],
    shortDescription:
      "Sculpted wired mouse built for hands over 19 cm, with a thumb shelf and braided cable."
  },
  {
    id: "ms-halcyon-hush-m",
    name: "Halcyon Hush M",
    brand: "Halcyon",
    category: "mice",
    price: 64.99,
    rating: 4.6,
    reviewCount: 1105,
    inStock: true,
    tags: ["wireless", "silent-click", "ergonomic"],
    shortDescription:
      "Near-silent switches rated for 20 million clicks, in a right-handed shell with a soft-touch coat."
  },
  {
    id: "ms-sable-trackball-t7",
    name: "Sable Trackball T7",
    brand: "Sable",
    category: "mice",
    price: 74.99,
    rating: 4.2,
    reviewCount: 431,
    inStock: true,
    tags: ["wireless", "trackball", "ergonomic"],
    shortDescription:
      "Thumb-operated trackball for cramped desks — the hand never moves, only the ball does."
  },
  {
    id: "ms-meridian-flow-master",
    name: "Meridian Flow Master",
    brand: "Meridian",
    category: "mice",
    price: 89.99,
    rating: 4.8,
    reviewCount: 4310,
    inStock: true,
    tags: ["wireless", "multi-device", "ergonomic", "rechargeable"],
    shortDescription:
      "The office standard: magnetic wheel, three-machine switching, and a full charge in about two hours."
  },
  {
    id: "ms-vantage-apex-8k",
    name: "Vantage Apex 8K",
    brand: "Vantage",
    category: "mice",
    price: 109.99,
    rating: 4.7,
    reviewCount: 668,
    inStock: true,
    tags: ["wireless", "gaming", "8k-polling"],
    shortDescription:
      "8 kHz wireless polling with optical switches and a magnesium shell weighing 54 g."
  },

  {
    id: "mn-bluecrest-view22",
    name: "Bluecrest View 22",
    brand: "Bluecrest",
    category: "monitors",
    price: 89.99,
    rating: 4.0,
    reviewCount: 1877,
    inStock: true,
    tags: ["1080p", "22-inch", "ips", "vesa"],
    shortDescription:
      "22-inch 1080p IPS panel with HDMI and VGA. The reliable second screen for a reception desk."
  },
  {
    id: "mn-orbit-clarity24",
    name: "Orbit Clarity 24",
    brand: "Orbit",
    category: "monitors",
    price: 129.99,
    rating: 4.3,
    reviewCount: 2410,
    inStock: true,
    tags: ["1080p", "24-inch", "ips", "75hz"],
    shortDescription:
      "24-inch 75 Hz IPS with slim bezels and a tilt stand. Ships with an HDMI cable in the box."
  },
  {
    id: "mn-vantage-pivot24",
    name: "Vantage Pivot 24",
    brand: "Vantage",
    category: "monitors",
    price: 149.99,
    rating: 4.4,
    reviewCount: 1024,
    inStock: true,
    tags: ["1080p", "24-inch", "pivot", "ergonomic"],
    shortDescription:
      "Height, tilt, swivel and 90-degree pivot — a 24-inch panel you can stand on its end for code."
  },
  {
    id: "mn-sable-portable16",
    name: "Sable Portable 16",
    brand: "Sable",
    category: "monitors",
    price: 159.99,
    rating: 4.1,
    reviewCount: 388,
    inStock: true,
    tags: ["portable", "16-inch", "1080p", "usb-c"],
    shortDescription:
      "16-inch travel panel driven by one USB-C cable, with a magnetic cover that folds into a stand."
  },
  {
    id: "mn-wren-slate27",
    name: "Wren Slate 27",
    brand: "Wren",
    category: "monitors",
    price: 179.99,
    rating: 4.2,
    reviewCount: 940,
    inStock: true,
    tags: ["1440p", "27-inch", "va", "vesa"],
    shortDescription:
      "27-inch 1440p VA panel with deep blacks and a plain plastic stand. Good value, average colour."
  },
  {
    id: "mn-tessera-frame25",
    name: "Tessera Frame 25",
    brand: "Tessera",
    category: "monitors",
    price: 199.99,
    rating: 4.4,
    reviewCount: 612,
    inStock: true,
    tags: ["1200p", "25-inch", "usb-c", "ips"],
    shortDescription:
      "25-inch 16:10 IPS with 65 W USB-C charging and a built-in hub, sized for a shallow desk."
  },
  {
    id: "mn-corvid-rush27",
    name: "Corvid Rush 27",
    brand: "Corvid",
    category: "monitors",
    price: 229.99,
    rating: 4.6,
    reviewCount: 3105,
    inStock: true,
    tags: ["1440p", "27-inch", "165hz", "gaming"],
    shortDescription:
      "27-inch 1440p at 165 Hz with adaptive sync and a 1 ms grey-to-grey response."
  },
  {
    id: "mn-nimbus-atlas27",
    name: "Nimbus Atlas 27",
    brand: "Nimbus",
    category: "monitors",
    price: 279.99,
    rating: 4.5,
    reviewCount: 1466,
    inStock: true,
    tags: ["1440p", "27-inch", "usb-c", "ips", "90w-charging"],
    shortDescription:
      "27-inch 1440p IPS that charges a laptop at 90 W and carries ethernet through the same cable."
  },
  {
    id: "mn-halcyon-still32",
    name: "Halcyon Still 32",
    brand: "Halcyon",
    category: "monitors",
    price: 329.99,
    rating: 4.5,
    reviewCount: 803,
    inStock: true,
    tags: ["4k", "32-inch", "ips", "hdr"],
    shortDescription:
      "32-inch 4K IPS with a matte finish and HDR400. Text at 100% scaling is comfortable at this size."
  },
  {
    id: "mn-kestrel-vista34",
    name: "Kestrel Vista 34",
    brand: "Kestrel",
    category: "monitors",
    price: 399.99,
    rating: 4.7,
    reviewCount: 1220,
    inStock: false,
    tags: ["ultrawide", "34-inch", "1440p", "curved"],
    shortDescription:
      "34-inch curved ultrawide at 3440x1440. Backordered — allocations resume after the next shipment."
  },
  {
    id: "mn-meridian-precision27",
    name: "Meridian Precision 27",
    brand: "Meridian",
    category: "monitors",
    price: 449.99,
    rating: 4.8,
    reviewCount: 517,
    inStock: true,
    tags: ["4k", "27-inch", "colour-accurate", "usb-c"],
    shortDescription:
      "Factory-calibrated 27-inch 4K covering 99% of sRGB and 95% of P3, with a printed report per unit."
  },
  {
    id: "mn-ironsmith-summit38",
    name: "Ironsmith Summit 38",
    brand: "Ironsmith",
    category: "monitors",
    price: 749.99,
    rating: 4.6,
    reviewCount: 209,
    inStock: true,
    tags: ["ultrawide", "38-inch", "thunderbolt", "curved"],
    shortDescription:
      "38-inch curved ultrawide with Thunderbolt daisy-chaining and 140 W of laptop charging."
  },

  {
    id: "hs-bluecrest-talk-usb",
    name: "Bluecrest Talk USB",
    brand: "Bluecrest",
    category: "headsets",
    price: 24.99,
    rating: 3.8,
    reviewCount: 1544,
    inStock: true,
    tags: ["wired", "usb", "mono", "call-centre"],
    shortDescription:
      "Single-ear USB headset with an in-line mute switch. Built for phone shifts, not for music."
  },
  {
    id: "hs-wren-loop-lite",
    name: "Wren Loop Lite",
    brand: "Wren",
    category: "headsets",
    price: 34.99,
    rating: 4.1,
    reviewCount: 877,
    inStock: true,
    tags: ["wireless", "on-ear", "bluetooth"],
    shortDescription:
      "Light on-ear Bluetooth set with 30 hours of playback and a folding hinge for a bag."
  },
  {
    id: "hs-orbit-echo-o2",
    name: "Orbit Echo O2",
    brand: "Orbit",
    category: "headsets",
    price: 44.99,
    rating: 4.3,
    reviewCount: 1211,
    inStock: true,
    tags: ["wired", "over-ear", "3.5mm", "gaming"],
    shortDescription:
      "Over-ear analogue set with a flip-to-mute boom. Plugs into a console pad or a laptop unchanged."
  },
  {
    id: "hs-sable-drift-buds",
    name: "Sable Drift Buds",
    brand: "Sable",
    category: "headsets",
    price: 59.99,
    rating: 4.2,
    reviewCount: 3320,
    inStock: true,
    tags: ["wireless", "in-ear", "bluetooth", "charging-case"],
    shortDescription:
      "In-ear buds with a pocket case, 6 hours per charge and 24 more in the case."
  },
  {
    id: "hs-corvid-signal-x",
    name: "Corvid Signal X",
    brand: "Corvid",
    category: "headsets",
    price: 69.99,
    rating: 4.5,
    reviewCount: 2033,
    inStock: true,
    tags: ["wireless", "over-ear", "noise-cancelling"],
    shortDescription:
      "Over-ear ANC set that pairs to two devices at once and folds flat for a laptop bag."
  },
  {
    id: "hs-tessera-clear-duo",
    name: "Tessera Clear Duo",
    brand: "Tessera",
    category: "headsets",
    price: 79.99,
    rating: 4.4,
    reviewCount: 654,
    inStock: true,
    tags: ["wireless", "dual-connect", "boom-mic", "office"],
    shortDescription:
      "Office set with a dedicated dongle plus Bluetooth, so a desk call and a phone call can co-exist."
  },
  {
    id: "hs-anvil-frame-hd",
    name: "Anvil Frame HD",
    brand: "Anvil",
    category: "headsets",
    price: 89.99,
    rating: 4.4,
    reviewCount: 1176,
    inStock: true,
    tags: ["wired", "over-ear", "detachable-mic"],
    shortDescription:
      "Steel-framed wired set with replaceable velour pads and a detachable microphone arm."
  },
  {
    id: "hs-kestrel-swift-air",
    name: "Kestrel Swift Air",
    brand: "Kestrel",
    category: "headsets",
    price: 99.99,
    rating: 4.7,
    reviewCount: 1402,
    inStock: false,
    tags: ["wireless", "low-latency", "gaming", "over-ear"],
    shortDescription:
      "Low-latency 2.4 GHz set with a 40-hour battery. Out of stock everywhere since the spring review."
  },
  {
    id: "hs-nimbus-halo-nc",
    name: "Nimbus Halo NC",
    brand: "Nimbus",
    category: "headsets",
    price: 119.99,
    rating: 4.6,
    reviewCount: 2870,
    inStock: true,
    tags: ["wireless", "noise-cancelling", "over-ear", "multipoint"],
    shortDescription:
      "Travel ANC set with multipoint pairing, a hard case, and a transparency mode for announcements."
  },
  {
    id: "hs-halcyon-quiet-office",
    name: "Halcyon Quiet Office",
    brand: "Halcyon",
    category: "headsets",
    price: 139.99,
    rating: 4.5,
    reviewCount: 995,
    inStock: true,
    tags: ["wireless", "noise-cancelling", "boom-mic", "dect"],
    shortDescription:
      "DECT desk set with a charging cradle and roaming up to 100 m from the base station."
  },
  {
    id: "hs-vantage-pilot-pro",
    name: "Vantage Pilot Pro",
    brand: "Vantage",
    category: "headsets",
    price: 159.99,
    rating: 4.6,
    reviewCount: 488,
    inStock: true,
    tags: ["wireless", "noise-cancelling", "aviation-mic"],
    shortDescription:
      "Aviation-grade boom microphone on a wireless frame — the set that survives an open-plan floor."
  },
  {
    id: "hs-meridian-studio-one",
    name: "Meridian Studio One",
    brand: "Meridian",
    category: "headsets",
    price: 189.99,
    rating: 4.8,
    reviewCount: 731,
    inStock: true,
    tags: ["wired", "studio", "open-back", "3.5mm"],
    shortDescription:
      "Open-back studio set with a neutral response and a 3 m coiled cable. No microphone, on purpose."
  },

  {
    id: "wc-bluecrest-snap720",
    name: "Bluecrest Snap 720",
    brand: "Bluecrest",
    category: "webcams",
    price: 19.99,
    rating: 3.7,
    reviewCount: 2401,
    inStock: true,
    tags: ["720p", "usb-a", "fixed-focus"],
    shortDescription:
      "720p fixed-focus webcam with a clip mount. Fine in daylight, grainy after dark."
  },
  {
    id: "wc-sable-clip-mini",
    name: "Sable Clip Mini",
    brand: "Sable",
    category: "webcams",
    price: 24.99,
    rating: 3.9,
    reviewCount: 706,
    inStock: true,
    tags: ["720p", "travel", "clip-on"],
    shortDescription:
      "Thumb-sized travel camera that clips to a laptop lid and stows in a coin pocket."
  },
  {
    id: "wc-wren-view1080",
    name: "Wren View 1080",
    brand: "Wren",
    category: "webcams",
    price: 29.99,
    rating: 4.0,
    reviewCount: 1832,
    inStock: true,
    tags: ["1080p", "usb-a", "privacy-shutter"],
    shortDescription:
      "1080p/30 webcam with a sliding privacy shutter and a tripod thread under the clip."
  },
  {
    id: "wc-orbit-focus-hd",
    name: "Orbit Focus HD",
    brand: "Orbit",
    category: "webcams",
    price: 39.99,
    rating: 4.3,
    reviewCount: 1290,
    inStock: true,
    tags: ["1080p", "autofocus", "usb-c"],
    shortDescription:
      "1080p autofocus camera that holds a face sharp when you lean back in the chair."
  },
  {
    id: "wc-corvid-frame60",
    name: "Corvid Frame 60",
    brand: "Corvid",
    category: "webcams",
    price: 54.99,
    rating: 4.4,
    reviewCount: 861,
    inStock: true,
    tags: ["1080p", "60fps", "autofocus", "streaming"],
    shortDescription:
      "1080p at 60 fps with manual exposure controls, aimed at people who stream rather than meet."
  },
  {
    id: "wc-tessera-studio-cam",
    name: "Tessera Studio Cam",
    brand: "Tessera",
    category: "webcams",
    price: 79.99,
    rating: 4.5,
    reviewCount: 1044,
    inStock: true,
    tags: ["1440p", "autofocus", "dual-mic", "privacy-shutter"],
    shortDescription:
      "1440p sensor with a two-microphone array that cuts typing clatter out of a call."
  },
  {
    id: "wc-vantage-frame-pro",
    name: "Vantage Frame Pro",
    brand: "Vantage",
    category: "webcams",
    price: 89.99,
    rating: 4.5,
    reviewCount: 933,
    inStock: true,
    tags: ["1080p", "autofocus", "light-correction", "tripod-mount"],
    shortDescription:
      "1080p camera with hardware light correction for rooms lit by one window behind you."
  },
  {
    id: "wc-nimbus-clarity4k",
    name: "Nimbus Clarity 4K",
    brand: "Nimbus",
    category: "webcams",
    price: 109.99,
    rating: 4.6,
    reviewCount: 1655,
    inStock: true,
    tags: ["4k", "autofocus", "hdr", "usb-c"],
    shortDescription:
      "4K sensor with HDR and a wide/narrow field-of-view switch. Downsamples to a clean 1080p."
  },
  {
    id: "wc-kestrel-pan360",
    name: "Kestrel Pan 360",
    brand: "Kestrel",
    category: "webcams",
    price: 129.99,
    rating: 4.7,
    reviewCount: 402,
    inStock: false,
    tags: ["4k", "pan-tilt", "tracking", "conference"],
    shortDescription:
      "Motorised pan-tilt conference camera that follows the speaker. Sold out since the last refresh."
  },
  {
    id: "wc-halcyon-meet-wide",
    name: "Halcyon Meet Wide",
    brand: "Halcyon",
    category: "webcams",
    price: 149.99,
    rating: 4.4,
    reviewCount: 318,
    inStock: true,
    tags: ["1080p", "120-degree", "conference", "speakerphone"],
    shortDescription:
      "120-degree meeting-room camera with a built-in speakerphone, for tables of up to six."
  },
  {
    id: "wc-meridian-broadcast-c1",
    name: "Meridian Broadcast C1",
    brand: "Meridian",
    category: "webcams",
    price: 199.99,
    rating: 4.8,
    reviewCount: 577,
    inStock: true,
    tags: ["4k", "hdr", "manual-focus", "streaming"],
    shortDescription:
      "4K broadcast camera with a manual focus ring and a cold shoe for a light on top."
  },

  {
    id: "dk-bluecrest-hub4",
    name: "Bluecrest Hub 4",
    brand: "Bluecrest",
    category: "docks",
    price: 17.99,
    rating: 4.0,
    reviewCount: 3410,
    inStock: true,
    tags: ["usb-a", "4-port", "bus-powered"],
    shortDescription:
      "Four-port USB-A hub, bus powered, with a 30 cm captive cable. Does one job for a decade."
  },
  {
    id: "dk-wren-link-c",
    name: "Wren Link C",
    brand: "Wren",
    category: "docks",
    price: 24.99,
    rating: 4.1,
    reviewCount: 1877,
    inStock: true,
    tags: ["usb-c", "hdmi", "3-in-1", "travel"],
    shortDescription:
      "Three-in-one travel adapter: HDMI, USB-A and 60 W pass-through charging in a dongle."
  },
  {
    id: "dk-sable-slim-c",
    name: "Sable Slim C",
    brand: "Sable",
    category: "docks",
    price: 29.99,
    rating: 4.0,
    reviewCount: 1409,
    inStock: true,
    tags: ["usb-c", "4-in-1", "aluminium", "travel"],
    shortDescription:
      "Aluminium four-port adapter shaped to sit flush against a laptop edge without wobbling."
  },
  {
    id: "dk-orbit-span7",
    name: "Orbit Span 7",
    brand: "Orbit",
    category: "docks",
    price: 39.99,
    rating: 4.3,
    reviewCount: 2266,
    inStock: true,
    tags: ["usb-c", "7-in-1", "sd-reader", "hdmi"],
    shortDescription:
      "Seven-in-one hub with SD and microSD readers, HDMI 4K/60 and two USB-A ports."
  },
  {
    id: "dk-vantage-port8",
    name: "Vantage Port 8",
    brand: "Vantage",
    category: "docks",
    price: 59.99,
    rating: 4.5,
    reviewCount: 977,
    inStock: true,
    tags: ["usb-c", "8-in-1", "hdmi", "ethernet", "100w"],
    shortDescription:
      "Eight-in-one hub with gigabit ethernet and 100 W pass-through, cool enough to leave plugged in."
  },
  {
    id: "dk-corvid-relay-dual",
    name: "Corvid Relay Dual",
    brand: "Corvid",
    category: "docks",
    price: 69.99,
    rating: 4.4,
    reviewCount: 1120,
    inStock: true,
    tags: ["usb-c", "dual-hdmi", "ethernet", "65w"],
    shortDescription:
      "Drives two 1440p displays over one USB-C cable while charging the laptop at 65 W."
  },
  {
    id: "dk-tessera-station11",
    name: "Tessera Station 11",
    brand: "Tessera",
    category: "docks",
    price: 99.99,
    rating: 4.5,
    reviewCount: 654,
    inStock: true,
    tags: ["usb-c", "11-in-1", "ethernet", "100w", "sd-reader"],
    shortDescription:
      "Eleven ports on a weighted base, including audio out and a card reader, at 100 W charging."
  },
  {
    id: "dk-halcyon-desk-mate",
    name: "Halcyon Desk Mate",
    brand: "Halcyon",
    category: "docks",
    price: 129.99,
    rating: 4.4,
    reviewCount: 289,
    inStock: true,
    tags: ["usb-c", "vertical", "laptop-stand", "85w"],
    shortDescription:
      "Vertical dock that doubles as a laptop stand, freeing the desk under a closed lid."
  },
  {
    id: "dk-kestrel-nest-pro",
    name: "Kestrel Nest Pro",
    brand: "Kestrel",
    category: "docks",
    price: 149.99,
    rating: 4.7,
    reviewCount: 431,
    inStock: false,
    tags: ["usb-c", "dual-4k", "90w", "ethernet"],
    shortDescription:
      "Dual 4K/60 over plain USB-C with 90 W charging. Out of stock — the next run ships in six weeks."
  },
  {
    id: "dk-nimbus-anchor-tb4",
    name: "Nimbus Anchor TB4",
    brand: "Nimbus",
    category: "docks",
    price: 189.99,
    rating: 4.6,
    reviewCount: 812,
    inStock: true,
    tags: ["thunderbolt", "96w", "dual-4k", "ethernet"],
    shortDescription:
      "Thunderbolt 4 dock with 96 W charging, dual 4K output and four downstream Thunderbolt ports."
  },
  {
    id: "dk-ironsmith-forge-dock",
    name: "Ironsmith Forge Dock",
    brand: "Ironsmith",
    category: "docks",
    price: 219.99,
    rating: 4.6,
    reviewCount: 233,
    inStock: true,
    tags: ["thunderbolt", "displayport", "120w", "kvm"],
    shortDescription:
      "Dock with a built-in KVM: one button hands your whole desk from the work laptop to the personal one."
  },
  {
    id: "dk-meridian-summit-tb5",
    name: "Meridian Summit TB5",
    brand: "Meridian",
    category: "docks",
    price: 299.99,
    rating: 4.8,
    reviewCount: 176,
    inStock: true,
    tags: ["thunderbolt", "140w", "triple-display", "ethernet"],
    shortDescription:
      "Thunderbolt 5 dock driving three displays with 140 W of charging and 2.5 gigabit ethernet."
  }
];

export const PRODUCTS_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export interface Filters {
  query: string;
  category: Category | null;
  minRating: number;
  inStockOnly: boolean;
  maxPrice: number | null;
  sortBy: SortBy;
}

export const DEFAULT_FILTERS: Filters = {
  query: "",
  category: null,
  minRating: 0,
  inStockOnly: false,
  maxPrice: null,
  sortBy: "price"
};

/**
 * Every query term must appear somewhere in the product — so "wireless
 * keyboard" means wireless AND keyboard, not either one.
 */
function matchesQuery(product: Product, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [
    product.name,
    product.brand,
    product.category,
    product.shortDescription,
    ...product.tags
  ]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function filterProducts(filters: Filters): Product[] {
  const matches = PRODUCTS.filter(
    (p) =>
      matchesQuery(p, filters.query) &&
      (filters.category === null || p.category === filters.category) &&
      p.rating >= filters.minRating &&
      (!filters.inStockOnly || p.inStock) &&
      (filters.maxPrice === null || p.price <= filters.maxPrice)
  );
  const sorted = [...matches];
  if (filters.sortBy === "price") sorted.sort((a, b) => a.price - b.price);
  else if (filters.sortBy === "rating") sorted.sort((a, b) => b.rating - a.rating);
  else sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Order numbers are derived from the order itself, not from a clock or a
 * random source, so a replayed benchmark run produces a replayable number.
 */
export function makeOrderNumber(seed: string, sequence: number): string {
  let hash = 2166136261 ^ sequence * 16777619;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let code = "";
  for (let i = 0; i < 5; i++) {
    hash = Math.imul(hash ^ (hash >>> 13), 16777619);
    code += CODE_ALPHABET.charAt(Math.abs(hash) % CODE_ALPHABET.length);
  }
  return `NW-${code}`;
}

export function money(value: number): string {
  return `$${value.toFixed(2)}`;
}
