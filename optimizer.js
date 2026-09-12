import { useEffect, useRef, useState } from "react";
import { TRANSPORT_RATE_PER_KM, QUALITY_RANK, wasteTypes } from "./data";

// ---------------------------------------------------------------------------
// This is a genuine (if simplified) greedy allocation heuristic — it actually
// runs against whatever supply/demand data you pass it. It is NOT a full
// LP/MILP solver, and the confidence score is a transparent, hand-written
// formula rather than a trained model — both are honest simplifications for
// a prototype, clearly labelled as such in the UI.
// ---------------------------------------------------------------------------

function baseMaterial(name) {
  return name
    .replace(/scrap|waste|&.*|\(.*\)/gi, "")
    .trim()
    .toLowerCase()
    .split(" ")[0];
}

function materialsCompatible(supplyMaterial, demandMaterial) {
  return baseMaterial(supplyMaterial) === baseMaterial(demandMaterial);
}

function qualityPenalty(itemQuality, requiredQuality) {
  const itemRank = QUALITY_RANK[itemQuality] ?? 1;
  const reqText = (requiredQuality || "").toLowerCase();
  let reqRank = 1;
  if (reqText.includes("grade a")) reqRank = 3;
  else if (reqText.includes("b+")) reqRank = 2;
  else if (reqText.includes("mixed acceptable") || reqText.includes("mixed")) reqRank = 0;
  const gap = Math.max(0, reqRank - itemRank);
  return gap * 4; // ₹/kg penalty per quality-grade shortfall (extra sorting cost)
}

export function computeAllocation(demand, supplyPool) {
  const candidates = supplyPool.filter((s) => materialsCompatible(s.material, demand.material));

  const scored = candidates.map((s) => {
    const transportCost = +(s.distance * TRANSPORT_RATE_PER_KM).toFixed(2);
    const penalty = qualityPenalty(s.quality, demand.quality);
    const landedCost = +(s.price + transportCost + penalty).toFixed(2);
    return { ...s, transportCost, qualityPenaltyPerKg: penalty, landedCost };
  });

  scored.sort((a, b) => a.landedCost - b.landedCost || Number(b.verified) - Number(a.verified));

  let remaining = demand.qty;
  const allocations = [];
  for (const s of scored) {
    if (remaining <= 0) break;
    const take = Math.min(s.qty, remaining);
    if (take <= 0) continue;
    allocations.push({ ...s, allocatedQty: take });
    remaining -= take;
  }

  const totalAllocated = demand.qty - remaining;
  const fulfilledPct = demand.qty > 0 ? Math.round((totalAllocated / demand.qty) * 100) : 0;

  const totalMaterialCost = allocations.reduce((sum, a) => sum + a.allocatedQty * a.price, 0);
  const totalTransportCost = allocations.reduce((sum, a) => sum + a.allocatedQty * a.transportCost, 0);
  const totalLandedCost = allocations.reduce((sum, a) => sum + a.allocatedQty * a.landedCost, 0);
  const avgLandedPrice = totalAllocated > 0 ? totalLandedCost / totalAllocated : 0;

  // Baseline: what it would cost if every kg came from the single worst
  // (highest landed-cost) supplier actually used — a stand-in for "no
  // aggregation, take whatever one source offers".
  const worstUnit = allocations.length ? Math.max(...allocations.map((a) => a.landedCost)) : 0;
  const baselineCost = worstUnit * totalAllocated;
  const savings = Math.max(0, baselineCost - totalLandedCost);
  const savingsPct = baselineCost > 0 ? Math.round((savings / baselineCost) * 100) : 0;

  const verifiedShare = allocations.length
    ? allocations.filter((a) => a.verified).length / allocations.length
    : 0;
  const confidence = Math.min(
    99,
    Math.round(45 + fulfilledPct * 0.35 + verifiedShare * 15 + Math.min(allocations.length, 5) * 2)
  );

  return {
    demand,
    allocations,
    totalAllocated,
    remaining,
    fulfilledPct,
    avgLandedPrice: +avgLandedPrice.toFixed(2),
    totalMaterialCost,
    totalTransportCost,
    totalLandedCost,
    baselineCost,
    savings,
    savingsPct,
    confidence,
    supplierCount: allocations.length,
  };
}

export function networkSignal(supply, demands, materialName) {
  const totalSupply = supply
    .filter((s) => materialsCompatible(s.material, materialName))
    .reduce((sum, s) => sum + s.qty, 0);
  const totalDemand = demands
    .filter((d) => materialsCompatible(d.material, materialName))
    .reduce((sum, d) => sum + d.qty, 0);
  const pressure = totalSupply > 0 ? Math.round(((totalDemand - totalSupply) / totalSupply) * 100) : 0;
  return { totalSupply, totalDemand, pressure };
}

export function estimateImpact(materialId, qty) {
  const material = wasteTypes.find((m) => m.id === materialId) || wasteTypes[0];
  const value = qty * material.avgPrice;
  const co2 = qty * material.co2Factor;
  return { material, value: Math.round(value), co2: Math.round(co2) };
}

// Animated count-up hook — respects prefers-reduced-motion.
export function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setValue(target);
      return;
    }

    let start = null;
    function step(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    }
    frame.current = requestAnimationFrame(step);
    return () => frame.current && cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}
