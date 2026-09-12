// ---------------------------------------------------------------------------
// ReLoop demo data layer.
// All numbers here are illustrative placeholders for a prototype pitch —
// avgPrice / co2Factor are rough public-domain-style estimates, not audited
// figures. Swap this file for a real API/database call when you're ready.
// ---------------------------------------------------------------------------

export const wasteTypes = [
  { id: "plastic", name: "Plastic (PET / HDPE)", icon: "♻", avgPrice: 55, co2Factor: 1.5 },
  { id: "paper", name: "Paper & Cardboard", icon: "▤", avgPrice: 14, co2Factor: 0.9 },
  { id: "metal", name: "Metals (Aluminium / Steel)", icon: "⚙", avgPrice: 140, co2Factor: 8.1 },
  { id: "ewaste", name: "E-Waste", icon: "⌁", avgPrice: 95, co2Factor: 1.2 },
  { id: "glass", name: "Glass", icon: "◈", avgPrice: 9, co2Factor: 0.3 },
  { id: "textile", name: "Textile", icon: "▦", avgPrice: 27, co2Factor: 3.6 },
  { id: "rubber", name: "Rubber", icon: "◉", avgPrice: 32, co2Factor: 2.4 },
  { id: "industrial", name: "Industrial Scrap", icon: "▰", avgPrice: 118, co2Factor: 4.4 },
];

export const sourceTypes = [
  { name: "Industry", icon: "🏭", desc: "Factories & manufacturing units" },
  { name: "Small Business", icon: "🏪", desc: "Shops, offices & workshops" },
  { name: "Individual / Household", icon: "👤", desc: "People & communities" },
  { name: "Kabadiwala / Aggregator", icon: "♻️", desc: "Local collection & aggregation" },
];

// Rough assumption used by the optimizer: transport cost per kg per km.
// Tune this to match real fuel/vehicle-capacity economics later.
export const TRANSPORT_RATE_PER_KM = 0.06;

export const QUALITY_RANK = {
  "Grade A": 3,
  "Grade B+": 2,
  "Grade B": 1,
  "Mixed / Unsorted": 0,
};

export const initialSupply = [
  { id: 1, seller: "Metro Manufacturing", role: "Industry", material: "Aluminium Scrap", qty: 1800, quality: "Grade A", location: "Peenya Industrial Area, Bengaluru", price: 142, verified: true, distance: 38 },
  { id: 2, seller: "GreenLoop Kabadi Network", role: "Kabadiwala", material: "Aluminium Scrap", qty: 900, quality: "Grade B+", location: "KR Market, Bengaluru", price: 136, verified: true, distance: 11 },
  { id: 3, seller: "Urban Fabricators", role: "Small Business", material: "Aluminium Scrap", qty: 1100, quality: "Grade A", location: "Whitefield, Bengaluru", price: 145, verified: true, distance: 24 },
  { id: 4, seller: "Community Collection Drive", role: "Individual / Household", material: "Aluminium Scrap", qty: 350, quality: "Grade B", location: "Indiranagar, Bengaluru", price: 128, verified: false, distance: 19 },
  { id: 5, seller: "Prime Auto Components", role: "Industry", material: "Aluminium Scrap", qty: 1250, quality: "Grade A", location: "Hosur Road, Bengaluru", price: 146, verified: true, distance: 51 },
  { id: 6, seller: "City Kabadi Hub", role: "Kabadiwala", material: "Mixed Metals", qty: 650, quality: "Grade B+", location: "Yeshwanthpur, Bengaluru", price: 119, verified: true, distance: 16 },
  { id: 7, seller: "Sundar Kabadiwala", role: "Kabadiwala", material: "Paper & Cardboard", qty: 2200, quality: "Grade B+", location: "Malleshwaram, Bengaluru", price: 13, verified: true, distance: 9 },
  { id: 8, seller: "CircuitBack Traders", role: "Small Business", material: "E-Waste", qty: 480, quality: "Grade A", location: "Electronic City, Bengaluru", price: 92, verified: true, distance: 29 },
  { id: 9, seller: "Sunrise Apartments RWA", role: "Individual / Household", material: "PET Plastic", qty: 610, quality: "Grade B", location: "HSR Layout, Bengaluru", price: 48, verified: false, distance: 14 },
];

export const initialDemands = [
  { id: 1, buyer: "EcoMetal Recycling", material: "Aluminium Scrap", qty: 5000, quality: "Grade B+ or better", location: "North Manufacturing Cluster, Bengaluru", targetPrice: 148, deadline: "20 Sep", verified: true },
  { id: 2, buyer: "PolyCycle Materials", material: "PET Plastic", qty: 3200, quality: "Washed / sorted", location: "Central Recycling Hub, Bengaluru", targetPrice: 62, deadline: "18 Sep", verified: true },
  { id: 3, buyer: "BuildGlass Industries", material: "Glass", qty: 8000, quality: "Sorted clear glass", location: "Industrial Corridor, Bengaluru", targetPrice: 9, deadline: "25 Sep", verified: true },
  { id: 4, buyer: "RenewTex Manufacturing", material: "Textile Waste", qty: 1500, quality: "Cotton / mixed", location: "Textile Cluster, Bengaluru", targetPrice: 28, deadline: "22 Sep", verified: false },
  { id: 5, buyer: "ReCircuit Electronics", material: "E-Waste", qty: 900, quality: "Mixed acceptable", location: "Electronic City, Bengaluru", targetPrice: 98, deadline: "28 Sep", verified: true },
];

export const initialTransactions = [
  { id: "RL-2026-0841", material: "Aluminium Scrap", quantity: "5,000 kg", buyer: "EcoMetal Recycling", value: "₹7.18L", status: "In Collection", progress: 68 },
  { id: "RL-2026-0837", material: "PET Plastic", quantity: "3,200 kg", buyer: "PolyCycle Materials", value: "₹1.98L", status: "Delivered", progress: 100 },
  { id: "RL-2026-0831", material: "Glass", quantity: "6,400 kg", buyer: "BuildGlass Industries", value: "₹57.6K", status: "AI Matched", progress: 32 },
  { id: "RL-2026-0829", material: "Paper & Cardboard", quantity: "2,200 kg", buyer: "Sundar Kabadiwala Network", value: "₹28.6K", status: "Delivered", progress: 100 },
];

export function materialIcon(material) {
  if (material.includes("Aluminium") || material.includes("Metal")) return "⚙";
  if (material.includes("Plastic") || material.includes("PET")) return "♻";
  if (material.includes("Glass")) return "◈";
  if (material.includes("Textile")) return "▦";
  if (material.includes("Paper")) return "▤";
  if (material.includes("E-Waste")) return "⌁";
  return "▰";
}
