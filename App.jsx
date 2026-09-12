import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  wasteTypes,
  sourceTypes,
  initialSupply,
  initialDemands,
  initialTransactions,
  materialIcon,
} from "./data";
import { computeAllocation, networkSignal, estimateImpact, useCountUp } from "./optimizer";

const inr = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const kg = (n) => `${Math.round(n).toLocaleString("en-IN")} kg`;

function App() {
  const [page, setPage] = useState("home");
  const [activeRole, setActiveRole] = useState("network");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [selectedSupply, setSelectedSupply] = useState(null);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [showAddWaste, setShowAddWaste] = useState(false);
  const [showDemand, setShowDemand] = useState(false);
  const [toast, setToast] = useState("");

  const [supply, setSupply] = useState(initialSupply);
  const [demands, setDemands] = useState(initialDemands);
  const [transactions] = useState(initialTransactions);

  const [selectedDemandId, setSelectedDemandId] = useState(initialDemands[0].id);
  const selectedDemandObj = demands.find((d) => d.id === selectedDemandId) || demands[0];
  const allocation = useMemo(
    () => computeAllocation(selectedDemandObj, supply),
    [selectedDemandObj, supply]
  );

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3200);
  };

  const navigate = (target) => {
    setPage(target);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <Navbar
        page={page}
        navigate={navigate}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
      />

      <main>
        {page === "home" && (
          <Home
            navigate={navigate}
            setActiveRole={setActiveRole}
            supply={supply}
            demands={demands}
          />
        )}

        {page === "marketplace" && (
          <Marketplace
            supply={supply}
            demands={demands}
            setSelectedSupply={setSelectedSupply}
            setSelectedDemand={setSelectedDemand}
            setShowAddWaste={setShowAddWaste}
            setShowDemand={setShowDemand}
          />
        )}

        {page === "ai" && (
          <AIOpportunities
            supply={supply}
            demands={demands}
            selectedDemandId={selectedDemandId}
            setSelectedDemandId={setSelectedDemandId}
            allocation={allocation}
            navigate={navigate}
          />
        )}

        {page === "optimizer" && (
          <Optimizer
            demands={demands}
            selectedDemandId={selectedDemandId}
            setSelectedDemandId={setSelectedDemandId}
            allocation={allocation}
          />
        )}

        {page === "logistics" && <Logistics allocation={allocation} />}

        {page === "prices" && <PriceIntelligence supply={supply} demands={demands} />}

        {page === "network" && <Network supply={supply} demands={demands} />}

        {page === "transactions" && <Transactions transactions={transactions} />}

        {page === "dashboard" && <Dashboard supply={supply} demands={demands} />}

        {page === "role" && (
          <RoleWorkspace
            role={activeRole}
            navigate={navigate}
            setShowAddWaste={setShowAddWaste}
            setShowDemand={setShowDemand}
          />
        )}
      </main>

      <Footer navigate={navigate} />

      {showAddWaste && (
        <AddWasteModal
          close={() => setShowAddWaste(false)}
          onSubmit={(data) => {
            setSupply((old) => [
              {
                id: Date.now(),
                seller: data.name,
                role: data.role,
                material: data.material,
                qty: Number(data.quantity),
                quality: data.quality,
                location: data.location,
                price: Number(data.price) || 0,
                verified: false,
                distance: Math.round(6 + Math.random() * 40),
              },
              ...old,
            ]);
            setShowAddWaste(false);
            notify(`${data.material} posted — ReLoop is matching it against live demand.`);
          }}
        />
      )}

      {showDemand && (
        <DemandModal
          close={() => setShowDemand(false)}
          onSubmit={(data) => {
            const id = Date.now();
            setDemands((old) => [
              {
                id,
                buyer: data.buyer,
                material: data.material,
                qty: Number(data.quantity),
                quality: data.quality,
                location: data.location,
                targetPrice: Number(data.price),
                deadline: data.deadline || "Flexible",
                verified: false,
              },
              ...old,
            ]);
            setSelectedDemandId(id);
            setShowDemand(false);
            notify(`Demand published — check AI Opportunities for a supply match.`);
          }}
        />
      )}

      {(selectedSupply || selectedDemand) && (
        <DetailModal
          supply={selectedSupply}
          demand={selectedDemand}
          close={() => {
            setSelectedSupply(null);
            setSelectedDemand(null);
          }}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

/* -------------------------------------------------------
   NAVBAR
------------------------------------------------------- */

function Navbar({ page, navigate, mobileNavOpen, setMobileNavOpen }) {
  const links = [
    ["home", "Home"],
    ["marketplace", "Marketplace"],
    ["ai", "AI Opportunities"],
    ["optimizer", "Optimizer"],
    ["logistics", "Logistics"],
    ["prices", "Price Intel"],
    ["network", "Network"],
    ["transactions", "Transactions"],
    ["dashboard", "Impact"],
  ];

  return (
    <header className="navbar">
      <div className="brand" onClick={() => navigate("home")}>
        <div className="brand-mark">
          <span>R</span>
        </div>
        <div>
          <strong>ReLoop</strong>
          <small>Circular supply network</small>
        </div>
      </div>

      <nav className="desktop-nav">
        {links.map(([id, label]) => (
          <button
            key={id}
            className={page === id ? "nav-link active" : "nav-link"}
            onClick={() => navigate(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="nav-actions">
        <button className="ghost-btn" onClick={() => navigate("role")}>
          My workspace
        </button>
      </div>

      <button
        className="hamburger"
        aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen((v) => !v)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {mobileNavOpen && (
        <div className="mobile-nav">
          {links.map(([id, label]) => (
            <button
              key={id}
              className={page === id ? "mobile-link active" : "mobile-link"}
              onClick={() => navigate(id)}
            >
              {label}
            </button>
          ))}
          <button className="mobile-link workspace" onClick={() => navigate("role")}>
            My workspace
          </button>
        </div>
      )}
    </header>
  );
}

/* -------------------------------------------------------
   HOME
------------------------------------------------------- */

function Home({ navigate, setActiveRole, supply, demands }) {
  const totalSupplyKg = supply.reduce((s, x) => s + x.qty, 0);
  const totalDemandKg = demands.reduce((s, x) => s + x.qty, 0);
  const verifiedCount = supply.filter((s) => s.verified).length;

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Every kabadiwala is already
            <br />
            <span>part of a network.</span>
          </h1>

          <p className="hero-text">
            ReLoop just draws the map. It connects factories, shops,
            households and local kabadiwalas to the recyclers who need
            their material — then works out who should supply whom, how
            much, at what price, and by which route.
          </p>

          <div className="hero-actions">
            <button
              className="primary-btn big"
              onClick={() => {
                setActiveRole("supplier");
                navigate("role");
              }}
            >
              I have material
            </button>

            <button
              className="secondary-btn big"
              onClick={() => {
                setActiveRole("buyer");
                navigate("role");
              }}
            >
              I need material
            </button>
          </div>

          <div className="hero-note">
            {supply.length} live supply listings · {demands.length} open buyer
            requirements right now
          </div>
        </div>

        <NetworkHero supply={supply} demands={demands} />
      </section>

      <section className="stats-strip">
        <Stat value={totalSupplyKg} suffix=" kg" label="Material listed on the network" />
        <Stat value={totalDemandKg} suffix=" kg" label="Buyer demand currently open" />
        <Stat value={verifiedCount} label="Verified suppliers live" />
        <Stat value={wasteTypes.length} label="Material categories tracked" />
      </section>

      <section className="section">
        <SectionHeading
          title="Everyone in the chain has a seat"
          subtitle="The same person can play more than one role. A kabadiwala can supply their own collected stock today and pick up a collection job tomorrow."
        />

        <RoleGrid navigate={navigate} setActiveRole={setActiveRole} />
      </section>

      <section className="dark-section">
        <div className="section-heading light">
          <h2>How a listing turns into a delivery</h2>
          <p>
            The steps below run for real in this prototype — try posting
            material or a demand and follow it through AI Opportunities.
          </p>
        </div>

        <ProcessFlow />
      </section>

      <section className="section">
        <SectionHeading
          title="What's your waste actually worth?"
          subtitle="A quick estimate of resale value and CO₂ avoided, using the same reference prices ReLoop uses across the network."
        />
        <ImpactCalculator />
      </section>

      <section className="cta-section">
        <div>
          <h2>What's the best way to move this material?</h2>
          <p>
            ReLoop compares direct supply, aggregation, collection hubs,
            transport and price before picking a path — run it on a live
            buyer requirement.
          </p>
        </div>
        <button className="primary-btn big" onClick={() => navigate("optimizer")}>
          Run the optimizer
        </button>
      </section>
    </div>
  );
}

function NetworkHero({ supply, demands }) {
  const kabadiQty = supply
    .filter((s) => s.role === "Kabadiwala")
    .reduce((s, x) => s + x.qty, 0);
  const industryQty = supply
    .filter((s) => s.role === "Industry")
    .reduce((s, x) => s + x.qty, 0);
  const householdQty = supply
    .filter((s) => s.role === "Individual / Household")
    .reduce((s, x) => s + x.qty, 0);
  const demandQty = demands.reduce((s, x) => s + x.qty, 0);

  return (
    <div className="network-visual">
      <div className="network-glow"></div>
      <div className="network-label">Live network snapshot</div>

      <div className="network-node n-industry">
        <span>🏭</span>
        <b>Industry</b>
        <small>{kg(industryQty)} listed</small>
      </div>

      <div className="network-node n-people">
        <span>👥</span>
        <b>Households</b>
        <small>{kg(householdQty)} listed</small>
      </div>

      <div className="network-node n-kabadi">
        <span>♻️</span>
        <b>Kabadiwala</b>
        <small>{kg(kabadiQty)} in stock</small>
      </div>

      <div className="ai-core">
        <div className="ai-ring"></div>
        <div className="ai-icon">AI</div>
        <strong>RELOOP</strong>
        <small>DECISION ENGINE</small>
      </div>

      <div className="network-node n-buyer">
        <span>🏗️</span>
        <b>Recyclers</b>
        <small>{kg(demandQty)} needed</small>
      </div>

      <div className="network-node n-logistics">
        <span>🚚</span>
        <b>Collection</b>
        <small>Route on demand</small>
      </div>

      <div className="connection c1"></div>
      <div className="connection c2"></div>
      <div className="connection c3"></div>
      <div className="connection c4"></div>
      <div className="connection c5"></div>

      <div className="network-caption">
        <span>Supply</span>
        <i>—</i>
        <strong>Understand · Match · Optimize</strong>
        <i>—</i>
        <span>Demand</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   IMPACT CALCULATOR
------------------------------------------------------- */

function ImpactCalculator() {
  const [materialId, setMaterialId] = useState(wasteTypes[0].id);
  const [qty, setQty] = useState(500);
  const { material, value, co2 } = estimateImpact(materialId, Number(qty) || 0);

  return (
    <div className="impact-calc">
      <div className="impact-inputs">
        <label className="field">
          <span>Material</span>
          <select value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            {wasteTypes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Quantity (kg)</span>
          <input
            type="number"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </label>
      </div>

      <div className="impact-outputs">
        <div className="impact-figure">
          <small>Estimated resale value</small>
          <strong>{inr(value)}</strong>
          <em>at ~₹{material.avgPrice}/kg reference price</em>
        </div>
        <div className="impact-figure">
          <small>CO₂ emissions avoided</small>
          <strong>{co2.toLocaleString("en-IN")} kg</strong>
          <em>vs. sending this to landfill or incineration</em>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   ROLES
------------------------------------------------------- */

function RoleGrid({ navigate, setActiveRole }) {
  const roles = [
    {
      id: "supplier",
      icon: "📦",
      title: "Giver / Supplier",
      desc: "Post waste or recyclable material and let ReLoop find the best buyer.",
      actions: ["Post material", "See buyer matches", "Get a price estimate"],
    },
    {
      id: "buyer",
      icon: "🏗️",
      title: "Buyer / Recycler",
      desc: "Publish what you need and let ReLoop assemble the supply.",
      actions: ["Post demand", "Find supply", "Build a supply batch"],
    },
    {
      id: "kabadiwala",
      icon: "♻️",
      title: "Kabadiwala / Aggregator",
      desc: "Turn local collection into structured inventory buyers can find.",
      actions: ["My material bank", "Aggregation jobs", "Collection routes"],
    },
    {
      id: "collection",
      icon: "🚚",
      title: "Collection Partner",
      desc: "Receive optimized pickup routes based on your capacity and area.",
      actions: ["Pickup jobs", "Optimized route", "Vehicle capacity"],
    },
  ];

  return (
    <div className="role-grid">
      {roles.map((role) => (
        <button
          className="role-card"
          key={role.id}
          onClick={() => {
            setActiveRole(role.id);
            navigate("role");
          }}
        >
          <div className="role-icon">{role.icon}</div>
          <h3>{role.title}</h3>
          <p>{role.desc}</p>

          <div className="role-features">
            {role.actions.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>

          <div className="card-cta">Explore this role</div>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------
   MARKETPLACE
------------------------------------------------------- */

function Marketplace({
  supply,
  demands,
  setSelectedSupply,
  setSelectedDemand,
  setShowAddWaste,
  setShowDemand,
}) {
  const [tab, setTab] = useState("supply");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("relevance");

  const filteredSupply = useMemo(() => {
    let items = supply.filter((s) => {
      const text = `${s.seller} ${s.material} ${s.location}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) return false;
      if (filter === "verified" && !s.verified) return false;
      if (filter === "bulk" && s.qty < 1000) return false;
      if (filter === "nearby" && s.distance > 20) return false;
      return true;
    });

    if (sort === "price-low") items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "price-high") items = [...items].sort((a, b) => b.price - a.price);
    if (sort === "distance") items = [...items].sort((a, b) => a.distance - b.distance);

    return items;
  }, [supply, query, filter, sort]);

  const signal = networkSignal(supply, demands, "Aluminium Scrap");

  return (
    <div className="page">
      <PageHeader
        eyebrow="Marketplace"
        title="Supply meets demand."
        text="Every listing becomes a node in the ReLoop network. The system evaluates whether it should be sold directly, aggregated, or routed through a collection hub."
      />

      <div className="market-actions">
        <button className="primary-btn" onClick={() => setShowAddWaste(true)}>
          + I have material
        </button>
        <button className="secondary-btn" onClick={() => setShowDemand(true)}>
          + I need material
        </button>
      </div>

      <div className="tab-bar">
        <button
          className={tab === "supply" ? "tab active" : "tab"}
          onClick={() => setTab("supply")}
        >
          Supply network <span>{supply.length}</span>
        </button>
        <button
          className={tab === "demand" ? "tab active" : "tab"}
          onClick={() => setTab("demand")}
        >
          Buyer demand <span>{demands.length}</span>
        </button>
      </div>

      <div className="search-row">
        <input
          className="search-input"
          type="text"
          placeholder="Search by material, seller or area…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {tab === "supply" && (
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="relevance">Sort: Relevance</option>
            <option value="price-low">Price: Low to high</option>
            <option value="price-high">Price: High to low</option>
            <option value="distance">Distance: Nearest first</option>
          </select>
        )}
      </div>

      {tab === "supply" ? (
        <div className="market-layout">
          <div className="market-main">
            <div className="filter-row">
              {[
                ["all", "All materials"],
                ["verified", "Verified"],
                ["bulk", "Bulk supply (1T+)"],
                ["nearby", "Nearby (<20km)"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={filter === id ? "filter active" : "filter"}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredSupply.length === 0 ? (
              <EmptyState text="Nothing matches those filters — try widening your search." />
            ) : (
              <div className="listing-grid">
                {filteredSupply.map((item) => (
                  <SupplyCard key={item.id} item={item} onClick={() => setSelectedSupply(item)} />
                ))}
              </div>
            )}
          </div>

          <aside className="side-panel">
            <div className="panel-title">
              <span>Market signal</span>
              <div className="mini-ai">AI</div>
            </div>

            <h3>
              {signal.pressure > 0 ? "Demand is pulling ahead on" : "Supply is ahead on"}{" "}
              Aluminium Scrap.
            </h3>
            <p>
              {kg(signal.totalDemand)} of open demand against {kg(signal.totalSupply)} of listed
              supply in the network right now.
            </p>

            <div className="signal-number">
              {signal.pressure > 0 ? "+" : ""}
              {signal.pressure}%
            </div>
            <small>demand vs. available supply</small>
          </aside>
        </div>
      ) : (
        <div className="demand-grid">
          {demands
            .filter((d) => {
              const text = `${d.buyer} ${d.material} ${d.location}`.toLowerCase();
              return !query || text.includes(query.toLowerCase());
            })
            .map((demand) => (
              <DemandCard key={demand.id} demand={demand} onClick={() => setSelectedDemand(demand)} />
            ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <span>—</span>
      <p>{text}</p>
    </div>
  );
}

function SupplyCard({ item, onClick }) {
  return (
    <button className="listing-card" onClick={onClick}>
      <div className="listing-top">
        <span className="material-chip">{materialIcon(item.material)}</span>
        {item.verified && <span className="status-chip">Verified</span>}
      </div>

      <h3>{item.material}</h3>
      <div className="quantity">{kg(item.qty)}</div>

      <div className="listing-info">
        <div>
          <small>Supplier</small>
          <strong>{item.seller}</strong>
        </div>
        <div>
          <small>Quality</small>
          <strong>{item.quality}</strong>
        </div>
      </div>

      <div className="listing-footer">
        <span>{item.distance} km away</span>
        <span>₹{item.price}/kg</span>
      </div>
    </button>
  );
}

function DemandCard({ demand, onClick }) {
  return (
    <button className="demand-card" onClick={onClick}>
      <div className="demand-header">
        <div className="material-chip">{materialIcon(demand.material)}</div>
        {demand.verified && <span className="status-chip">Verified</span>}
      </div>

      <h3>{demand.material}</h3>
      <div className="demand-number">{kg(demand.qty)} required</div>

      <div className="demand-details">
        <span>{demand.buyer}</span>
        <span>{demand.location}</span>
        <span>₹{demand.targetPrice}/kg target</span>
        <span>By {demand.deadline}</span>
      </div>

      <div className="card-cta">Open this requirement</div>
    </button>
  );
}

/* -------------------------------------------------------
   AI OPPORTUNITIES
------------------------------------------------------- */

function DemandSelector({ demands, value, onChange }) {
  return (
    <label className="field demand-selector">
      <span>Buyer requirement</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {demands.map((d) => (
          <option key={d.id} value={d.id}>
            {d.buyer} — {d.material} ({kg(d.qty)})
          </option>
        ))}
      </select>
    </label>
  );
}

function AIOpportunities({ demands, selectedDemandId, setSelectedDemandId, allocation, navigate }) {
  const [selected, setSelected] = useState("aggregation");

  return (
    <div className="page">
      <PageHeader
        eyebrow="AI Opportunity Center"
        title="Not just 'who matches?' — 'what's the best combination?'"
        text="Pick a live buyer requirement below. Everything on this page is computed against your actual supply data, not scripted."
      />

      <div className="ai-command-bar">
        <div>
          <div className="mini-ai">AI</div>
          <div>
            <strong>Decision engine ready</strong>
            <small>{allocation.supplierCount} suppliers selected for this requirement</small>
          </div>
        </div>
        <DemandSelector demands={demands} value={selectedDemandId} onChange={setSelectedDemandId} />
      </div>

      <div className="ai-layout">
        <div className="ai-opportunity-list">
          <AIOpportunity
            active={selected === "aggregation"}
            icon="⬡"
            title="Aggregation opportunity"
            score={allocation.confidence}
            subtitle="One buyer, multiple suppliers"
            onClick={() => setSelected("aggregation")}
          />
          <AIOpportunity
            active={selected === "route"}
            icon="↗"
            title="Logistics opportunity"
            score={allocation.savingsPct}
            subtitle="Collection route for this batch"
            onClick={() => setSelected("route")}
          />
          <AIOpportunity
            active={selected === "quality"}
            icon="◇"
            title="Quality opportunity"
            score={Math.round(allocation.fulfilledPct)}
            subtitle="Grade mix vs. requirement"
            onClick={() => setSelected("quality")}
          />
        </div>

        <div className="ai-detail">
          {selected === "aggregation" && <AggregationDetail allocation={allocation} navigate={navigate} />}
          {selected === "route" && <RouteDetail allocation={allocation} navigate={navigate} />}
          {selected === "quality" && <QualityDetail allocation={allocation} />}
        </div>
      </div>
    </div>
  );
}

function AIOpportunity({ active, icon, title, score, subtitle, onClick }) {
  return (
    <button className={active ? "ai-opportunity active" : "ai-opportunity"} onClick={onClick}>
      <span className="opp-icon">{icon}</span>
      <span className="opp-text">
        <b>{title}</b>
        <small>{subtitle}</small>
      </span>
      <span className="opp-score">{score}</span>
    </button>
  );
}

function AggregationDetail({ allocation, navigate }) {
  const { demand, allocations, fulfilledPct, avgLandedPrice, savingsPct, confidence } = allocation;

  if (allocations.length === 0) {
    return <EmptyState text="No compatible supply currently listed for this material." />;
  }

  return (
    <div>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">Optimal supply batch</span>
          <h2>{kg(demand.qty)} {demand.material}</h2>
          <p>
            {fulfilledPct >= 100
              ? "Fully covered by the network."
              : `${fulfilledPct}% coverable with current listed supply.`}
          </p>
        </div>
        <div className="big-score">
          <b>{confidence}</b>
          <span>confidence score</span>
        </div>
      </div>

      <div className="optimization-visual">
        {allocations.map((s, index) => (
          <div className="opt-source" key={s.id}>
            <div className="source-number">{index + 1}</div>
            <div>
              <b>{s.seller}</b>
              <small>{kg(s.allocatedQty)} · ₹{s.price}/kg</small>
            </div>
          </div>
        ))}

        <div className="opt-arrow">↓</div>

        <div className="batch-node">
          <span>AI</span>
          <b>{kg(allocation.totalAllocated)} supply batch</b>
          <small>Landed avg ₹{avgLandedPrice}/kg</small>
        </div>

        <div className="opt-arrow">↓</div>

        <div className="buyer-node">
          <span>🏗️</span>
          <div>
            <b>{demand.buyer}</b>
            <small>{kg(demand.qty)} demand</small>
          </div>
        </div>
      </div>

      <div className="why-grid">
        <WhyCard icon="⚖" title="Allocation" value={`${allocation.supplierCount} suppliers`} text="Lowest landed-cost combination" />
        <WhyCard icon="₹" title="Landed price" value={`₹${avgLandedPrice}/kg`} text="Price + transport + quality-adjusted" />
        <WhyCard icon="🚚" title="Vs. single source" value={`−${savingsPct}%`} text="Compared with one supplier alone" />
        <WhyCard icon="⏱" title="Deadline" value={demand.deadline} text="Target date for this requirement" />
      </div>

      <div className="formula-box">
        <div className="formula-title">
          <span>Allocation logic</span>
          <span>Greedy least-landed-cost</span>
        </div>
        <code>
          landed(i) = price(i) + distance(i) × rate + quality_gap(i) × penalty
          <br />
          allocate smallest landed(i) first, until demand is met or supply runs out
        </code>
        <p>
          This is a transparent heuristic running on your real listings — a
          production version would extend this to a full LP/MILP solve
          across the whole network at once.
        </p>
      </div>

      <button className="primary-btn" onClick={() => navigate("optimizer")}>
        Inspect the optimizer model
      </button>
    </div>
  );
}

function RouteDetail({ allocation, navigate }) {
  const { allocations, demand } = allocation;
  if (allocations.length === 0) return <EmptyState text="No route to plan yet — no matching supply." />;

  const totalDistance = allocations.reduce((s, a) => s + a.distance, 0);
  const totalTransport = allocation.totalTransportCost;

  return (
    <div>
      <span className="eyebrow">Logistics for this batch</span>
      <h2>{allocations.length} pickup{allocations.length > 1 ? "s" : ""} → 1 delivery</h2>

      <div className="route-visual">
        {allocations.map((s, i) => (
          <div className="route-point" key={s.id}>
            <span>{i + 1}</span>
            <b>{s.seller}</b>
            <small>{kg(s.allocatedQty)}</small>
          </div>
        ))}
        <div className="route-point final">
          <span>✓</span>
          <b>{demand.buyer}</b>
          <small>{kg(demand.qty)}</small>
        </div>
      </div>

      <div className="route-stats">
        <Stat value={totalDistance} suffix=" km" label="Combined pickup distance" />
        <Stat value={Math.round(totalTransport)} prefix="₹" label="Transport cost, this batch" />
        <Stat value={allocation.savingsPct} suffix="%" label="Saving vs. single-source pickup" />
      </div>

      <button className="secondary-btn" onClick={() => navigate("logistics")}>
        Open logistics control
      </button>
    </div>
  );
}

function QualityDetail({ allocation }) {
  const { allocations, demand } = allocation;
  if (allocations.length === 0) return <EmptyState text="No supply to grade yet." />;

  return (
    <div>
      <span className="eyebrow">Quality mix for this requirement</span>
      <h2>Required: {demand.quality}</h2>

      <div className="quality-visual">
        {allocations.map((s) => (
          <div className="quality-card" key={s.id}>
            <span>{s.quality}</span>
            <strong>{kg(s.allocatedQty)}</strong>
            <small>{s.seller}</small>
          </div>
        ))}
      </div>

      <div className="info-callout">
        <b>Quality-adjusted cost</b>
        <p>
          Suppliers below the requested grade carry a small per-kg penalty
          in the allocation (representing the buyer's extra sorting cost),
          rather than being excluded outright.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   OPTIMIZER
------------------------------------------------------- */

function Optimizer({ demands, selectedDemandId, setSelectedDemandId, allocation }) {
  const stageLabels = [
    "Reading live supply & demand",
    "Filtering compatible materials",
    "Pricing in transport & quality",
    "Sorting by landed cost",
    "Allocating supply to demand",
    "Building the execution plan",
  ];
  const [stage, setStage] = useState(stageLabels.length - 1);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setStage(0);
    let current = 0;
    const timer = setInterval(() => {
      current++;
      setStage(current);
      if (current >= stageLabels.length - 1) {
        clearInterval(timer);
        setRunning(false);
      }
    }, 260);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="ReLoop Decision Engine"
        title="Solve the allocation problem."
        text="This is the scientific core of the prototype: real supply and demand data goes in, a ranked allocation comes out."
      />

      <div className="optimizer-dashboard">
        <div className="optimizer-top">
          <div>
            <span className="eyebrow">Model status</span>
            <h2>Network optimization engine</h2>
            <p>Greedy least-cost heuristic · a full solve would extend this to LP/MILP + routing</p>
          </div>

          <div className="optimizer-controls">
            <DemandSelector demands={demands} value={selectedDemandId} onChange={setSelectedDemandId} />
            <button className="primary-btn big" onClick={run} disabled={running}>
              {running ? "Solving…" : "Solve this requirement"}
            </button>
          </div>
        </div>

        <div className="solver-steps">
          {stageLabels.map((step, index) => (
            <div className={index <= stage ? "solver-step completed" : "solver-step"} key={step}>
              <span>{index < stage ? "✓" : index + 1}</span>
              <div>
                <b>{step}</b>
                {index === stage && running && <small>Processing…</small>}
              </div>
            </div>
          ))}
        </div>

        <div className="model-grid">
          <ModelCard title="Decision variable" value="x(i,j)" text="Quantity allocated from supplier i to buyer j" />
          <ModelCard title="Objective" value="MIN Z" text="Minimize material + transport + quality-adjusted cost" />
          <ModelCard title="Supply limit" value="Σx ≤ S(i)" text="No supplier exceeds what they listed" />
          <ModelCard title="Demand target" value="Σx ≤ D(j)" text="Never over-allocate past what's required" />
        </div>

        <div className="solver-output">
          <div className="output-header">
            <div>
              <span className="eyebrow">Solver output</span>
              <h3>{allocation.demand.buyer} — {allocation.demand.material}</h3>
            </div>
            <span className="optimal-badge">
              {allocation.fulfilledPct >= 100 ? "FULLY COVERED" : `${allocation.fulfilledPct}% COVERED`}
            </span>
          </div>

          <div className="output-metrics">
            <Metric label="Suppliers used" value={allocation.supplierCount} />
            <Metric label="Allocated" value={kg(allocation.totalAllocated)} />
            <Metric label="Avg landed price" value={`₹${allocation.avgLandedPrice}`} />
            <Metric label="Transport cost" value={inr(allocation.totalTransportCost)} />
            <Metric label="Saving vs. single source" value={`${allocation.savingsPct}%`} />
            <Metric label="Fulfilment" value={`${allocation.fulfilledPct}%`} />
          </div>

          <div className="allocation-table">
            <div className="allocation-row head">
              <span>Supplier</span>
              <span>Allocated</span>
              <span>Unit price</span>
              <span>Transport</span>
              <span>Landed cost</span>
            </div>

            {allocation.allocations.length === 0 ? (
              <div className="allocation-row">
                <span>No compatible supply listed for this material yet.</span>
              </div>
            ) : (
              allocation.allocations.map((a) => (
                <div className="allocation-row" key={a.id}>
                  <span>{a.seller}</span>
                  <b>{kg(a.allocatedQty)}</b>
                  <span>₹{a.price}/kg</span>
                  <span>₹{a.transportCost}/kg</span>
                  <strong className="select-text">₹{a.landedCost}/kg</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelCard({ title, value, text }) {
  return (
    <div className="model-card">
      <small>{title}</small>
      <strong>{value}</strong>
      <p>{text}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

/* -------------------------------------------------------
   LOGISTICS
------------------------------------------------------- */

function Logistics({ allocation }) {
  const { allocations, demand } = allocation;
  const totalDistance = allocations.reduce((s, a) => s + a.distance, 0);
  const totalTransport = allocation.totalTransportCost;
  const baselineDistance = allocations.length ? Math.max(...allocations.map((a) => a.distance)) * allocations.length : 0;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Logistics control center"
        title="Move material intelligently."
        text={`Route currently planned for ${demand.buyer}'s ${demand.material} requirement — switch the buyer on the AI Opportunities or Optimizer page to see a different route.`}
      />

      <div className="logistics-layout">
        <div className="map-panel">
          <div className="map-grid"></div>
          <div className="map-title">
            <span className="eyebrow">Route simulation</span>
            <h3>{demand.buyer}</h3>
          </div>

          <svg className="route-svg" viewBox="0 0 600 420" preserveAspectRatio="none">
            {allocations.map((a, i) => {
              const startX = 60 + i * (480 / Math.max(allocations.length - 1, 1));
              return (
                <path
                  key={a.id}
                  className="route-path"
                  d={`M ${startX} 90 Q ${300} ${260}, 500 330`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              );
            })}
          </svg>

          {allocations.map((a, i) => (
            <div
              className="map-node"
              key={a.id}
              style={{ top: 70, left: `${8 + i * (75 / Math.max(allocations.length - 1, 1))}%` }}
            >
              <span>{i + 1}</span>
              {a.seller}
            </div>
          ))}

          <div className="map-node map-node-final">
            <span>✓</span>
            {demand.buyer}
          </div>

          <div className="truck">🚚</div>
        </div>

        <div className="logistics-side">
          <div className="route-summary">
            <span className="eyebrow">Route engine</span>
            <h2>{allocations.length} pickups → 1 delivery</h2>
            <p>For {kg(allocation.totalAllocated)} of {demand.material}</p>

            <div className="route-stat-list">
              <div>
                <span>Combined distance</span>
                <b>{totalDistance} km</b>
              </div>
              <div>
                <span>Transport cost</span>
                <b>{inr(totalTransport)}</b>
              </div>
              <div>
                <span>Single-source baseline</span>
                <b>{baselineDistance} km</b>
              </div>
              <div className="saving">
                <span>Optimization saving</span>
                <b>{allocation.savingsPct}%</b>
              </div>
            </div>
          </div>

          <div className="partner-card">
            <div className="partner-avatar">🚚</div>
            <div>
              <b>Collection Partner #17</b>
              <small>Verified · 4.8/5 reliability</small>
            </div>
            <span className="online">Online</span>
          </div>
        </div>
      </div>

      <section className="section compact">
        <SectionHeading
          title="A kabadiwala can be logistics infrastructure, not just a seller."
          subtitle="ReLoop can assign collection jobs when a kabadiwala's location, capacity and reliability make the route economical — not only when they're the one selling."
        />

        <div className="partner-grid">
          <PartnerCard icon="♻️" name="GreenLoop Kabadi Network" role="Supplier + aggregator" jobs="42 completed" reliability="97%" />
          <PartnerCard icon="🚚" name="MoveCycle Logistics" role="Collection partner" jobs="186 completed" reliability="94%" />
          <PartnerCard icon="♻️" name="Sundar Kabadiwala" role="Aggregator + collection" jobs="73 completed" reliability="96%" />
        </div>
      </section>
    </div>
  );
}

function PartnerCard({ icon, name, role, jobs, reliability }) {
  return (
    <div className="partner-list-card">
      <div className="partner-avatar">{icon}</div>
      <div className="partner-main">
        <b>{name}</b>
        <small>{role}</small>
      </div>
      <div className="partner-stat">
        <b>{jobs}</b>
        <small>Jobs</small>
      </div>
      <div className="partner-stat">
        <b>{reliability}</b>
        <small>On-time</small>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   PRICE INTELLIGENCE
------------------------------------------------------- */

function PriceIntelligence({ supply, demands }) {
  const [materialId, setMaterialId] = useState(wasteTypes[2].id);
  const material = wasteTypes.find((m) => m.id === materialId);
  const nameGuess = material.name.split("(")[0].trim();
  const signal = networkSignal(supply, demands, nameGuess);

  const low = Math.round(material.avgPrice * 0.92);
  const high = Math.round(material.avgPrice * 1.08);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Price intelligence"
        title="Price is not just a number."
        text="ReLoop combines buyer demand, available supply, quality and geography to estimate a realistic price range — not just the highest quote."
      />

      <div className="price-controls">
        {wasteTypes.map((m) => (
          <button
            key={m.id}
            className={materialId === m.id ? "filter active" : "filter"}
            onClick={() => setMaterialId(m.id)}
          >
            {m.icon} {m.name}
          </button>
        ))}
      </div>

      <div className="price-dashboard">
        <div className="price-main-card">
          <span className="eyebrow">Network reference</span>
          <h2>{material.name}</h2>

          <div className="price-big">
            ₹{low}–₹{high}
            <span>/kg</span>
          </div>

          <div className="trend">
            <b>{signal.pressure > 0 ? "+" : ""}{signal.pressure}%</b>
            <span>demand pressure vs. listed supply</span>
          </div>
        </div>

        <div className="price-side">
          <SignalCard title="Open demand" value={kg(signal.totalDemand)} />
          <SignalCard title="Listed supply" value={kg(signal.totalSupply)} />
          <SignalCard title="Reference price" value={`₹${material.avgPrice}/kg`} />
          <SignalCard title="Est. CO₂ saved/kg" value={`${material.co2Factor} kg`} />
        </div>
      </div>

      <div className="section compact">
        <SectionHeading
          title="How ReLoop reads a price"
          subtitle="The platform avoids blindly chasing the highest quoted number."
        />

        <div className="price-factor-grid">
          <Factor title="Buyer price" value={`₹${high}/kg`} />
          <Factor title="Collection cost" value="−₹2–4/kg" />
          <Factor title="Transport cost" value="Distance × rate" />
          <Factor title="Quality adjustment" value="Grade-dependent" />
          <Factor title="Aggregation benefit" value="Shared route cost" />
          <Factor title="Landed value" value={`~₹${low}/kg`} />
        </div>
      </div>
    </div>
  );
}

function SignalCard({ title, value }) {
  return (
    <div className="signal-card">
      <small>{title}</small>
      <strong>{value}</strong>
    </div>
  );
}

function Factor({ title, value }) {
  return (
    <div className="factor">
      <small>{title}</small>
      <b>{value}</b>
    </div>
  );
}

/* -------------------------------------------------------
   NETWORK
------------------------------------------------------- */

function Network({ supply, demands }) {
  const byRole = (role) => supply.filter((s) => s.role === role).length;

  const nodes = [
    { name: "Industries", count: byRole("Industry"), type: "Supply" },
    { name: "Small businesses", count: byRole("Small Business"), type: "Supply" },
    { name: "Households", count: byRole("Individual / Household"), type: "Supply" },
    { name: "Kabadiwalas", count: byRole("Kabadiwala"), type: "Supply + collection" },
    { name: "Recyclers / buyers", count: demands.length, type: "Demand" },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Network graph"
        title="A city-scale circular network."
        text="Every participant becomes a node. ReLoop's job is to coordinate the network so material reaches the right destination at the right economics."
      />

      <div className="network-dashboard">
        <div className="graph-area">
          <div className="graph-title">
            <span>Live network model</span>
            <small>{supply.length + demands.length} active listings in this demo</small>
          </div>

          <div className="graph-center">
            <div className="graph-ai">
              <b>AI</b>
              <small>RELOOP</small>
            </div>
          </div>

          <div className="graph-orbit orbit1"></div>
          <div className="graph-orbit orbit2"></div>

          <GraphNode cls="g1" icon="🏭" label="Industry" />
          <GraphNode cls="g2" icon="🏪" label="Business" />
          <GraphNode cls="g3" icon="👤" label="People" />
          <GraphNode cls="g4" icon="♻️" label="Kabadi" />
          <GraphNode cls="g5" icon="🏗️" label="Recycler" />
          <GraphNode cls="g6" icon="🚚" label="Logistics" />
        </div>

        <div className="network-node-list">
          <div className="panel-title">
            <span>Network participants</span>
          </div>

          {nodes.map((n) => (
            <div className="network-list-row" key={n.name}>
              <div>
                <b>{n.name}</b>
                <small>{n.type}</small>
              </div>
              <strong>{n.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GraphNode({ cls, icon, label }) {
  return (
    <div className={`graph-node ${cls}`}>
      <span>{icon}</span>
      <b>{label}</b>
    </div>
  );
}

/* -------------------------------------------------------
   TRANSACTIONS
------------------------------------------------------- */

function Transactions({ transactions }) {
  const [selected, setSelected] = useState(transactions[0]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Transaction control"
        title="From post to settlement."
        text="Every transaction moves through an auditable lifecycle so the network can coordinate collection, delivery and settlement."
      />

      <div className="transaction-layout">
        <div className="transaction-list">
          {transactions.map((tx) => (
            <button
              key={tx.id}
              className={selected.id === tx.id ? "transaction-card active" : "transaction-card"}
              onClick={() => setSelected(tx)}
            >
              <div className="tx-id">{tx.id}</div>
              <h3>{tx.material}</h3>
              <div className="tx-meta">{tx.quantity} · {tx.buyer}</div>
              <div className="progress">
                <span style={{ width: `${tx.progress}%` }}></span>
              </div>
              <div className="tx-bottom">
                <span>{tx.status}</span>
                <b>{tx.value}</b>
              </div>
            </button>
          ))}
        </div>

        <div className="transaction-detail">
          <div className="tx-detail-head">
            <div>
              <span className="eyebrow">{selected.id}</span>
              <h2>{selected.material}</h2>
              <p>{selected.quantity} · {selected.buyer}</p>
            </div>
            <span className="optimal-badge">{selected.status}</span>
          </div>

          <TransactionTimeline progress={selected.progress} />

          <div className="settlement-card">
            <div>
              <small>Estimated transaction value</small>
              <strong>{selected.value}</strong>
            </div>
            <div>
              <small>ReLoop coordination</small>
              <strong>Active</strong>
            </div>
            <div>
              <small>Trust state</small>
              <strong>Verified</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionTimeline({ progress }) {
  const steps = [
    ["Posted", "Material or demand entered"],
    ["AI matched", "Economic opportunity identified"],
    ["Allocated", "Supply quantity reserved"],
    ["Collected", "Collection partner pickup"],
    ["Delivered", "Buyer receives material"],
    ["Settled", "Transaction completed"],
  ];

  const completed = Math.round((progress / 100) * steps.length);

  return (
    <div className="timeline">
      {steps.map(([title, desc], index) => (
        <div key={title} className={index < completed ? "timeline-step done" : "timeline-step"}>
          <div className="timeline-dot">{index < completed ? "✓" : index + 1}</div>
          <div>
            <b>{title}</b>
            <small>{desc}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------
   DASHBOARD
------------------------------------------------------- */

function Dashboard({ supply, demands }) {
  const byMaterialGroup = (keyword) =>
    supply.filter((s) => s.material.toLowerCase().includes(keyword)).reduce((s, x) => s + x.qty, 0);

  const groups = [
    ["Metals", byMaterialGroup("aluminium") + byMaterialGroup("metal")],
    ["Plastic", byMaterialGroup("plastic") + byMaterialGroup("pet")],
    ["Paper", byMaterialGroup("paper")],
    ["E-Waste", byMaterialGroup("e-waste")],
  ];
  const maxGroup = Math.max(...groups.map((g) => g[1]), 1);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Network impact"
        title="ReLoop in numbers."
        text="Live counts from this demo's data, alongside the kind of impact metrics a production deployment would track."
      />

      <div className="dashboard-kpis">
        <DashboardKPI icon="♻" value={supply.reduce((s, x) => s + x.qty, 0)} suffix=" kg" label="Material currently listed" />
        <DashboardKPI icon="🏗️" value={demands.reduce((s, x) => s + x.qty, 0)} suffix=" kg" label="Buyer demand currently open" />
        <DashboardKPI icon="✓" value={supply.filter((s) => s.verified).length} label="Verified suppliers" />
        <DashboardKPI icon="🌱" value={supply.reduce((s, x) => s + Math.round(x.qty * 3), 0)} suffix=" kg" label="Est. CO₂ avoided if all sold" />
      </div>

      <div className="dashboard-grid">
        <div className="big-dashboard-card">
          <div className="dashboard-card-head">
            <div>
              <span className="eyebrow">Material mix</span>
              <h3>Listed supply by category</h3>
            </div>
          </div>

          <div className="material-bars">
            {groups.map(([label, value]) => (
              <Bar key={label} label={label} value={`${Math.round((value / maxGroup) * 100)}%`} number={kg(value)} />
            ))}
          </div>
        </div>

        <div className="big-dashboard-card">
          <div className="dashboard-card-head">
            <div>
              <span className="eyebrow">Network health</span>
              <h3>Coordination snapshot</h3>
            </div>
          </div>

          <div className="health-items">
            <span>{demands.length} open buyer requirements</span>
            <span>{supply.length} active supply listings</span>
            <span>{supply.filter((s) => s.verified).length} of {supply.length} suppliers verified</span>
            <span>{wasteTypes.length} material categories tracked</span>
          </div>
        </div>
      </div>

      <div className="section compact">
        <SectionHeading
          title="The value is in coordination."
          subtitle="ReLoop doesn't create value by owning waste — it creates value by coordinating fragmented supply, demand and logistics that already exist."
        />

        <div className="value-chain">
          <ValueStep title="Discover" text="Understand fragmented supply and demand." />
          <ValueStep title="Match" text="Find technically compatible participants." />
          <ValueStep title="Optimize" text="Select the lowest-cost feasible allocation." />
          <ValueStep title="Move" text="Coordinate collection and transport." />
          <ValueStep title="Settle" text="Complete the transaction and record impact." />
        </div>
      </div>
    </div>
  );
}

function DashboardKPI({ icon, value, suffix = "", label }) {
  const count = useCountUp(value);
  return (
    <div className="dashboard-kpi">
      <div className="kpi-icon">{icon}</div>
      <strong>{count.toLocaleString("en-IN")}{suffix}</strong>
      <span>{label}</span>
    </div>
  );
}

function Bar({ label, value, number }) {
  return (
    <div className="bar-row">
      <div>
        <span>{label}</span>
        <b>{number}</b>
      </div>
      <div className="bar-track">
        <span style={{ width: value }}></span>
      </div>
    </div>
  );
}

function ValueStep({ title, text }) {
  return (
    <div className="value-step">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

/* -------------------------------------------------------
   ROLE WORKSPACE
------------------------------------------------------- */

function RoleWorkspace({ role, navigate, setShowAddWaste, setShowDemand }) {
  const roleData = {
    network: { title: "Your ReLoop workspace", subtitle: "Choose how you participate in the circular network.", icon: "◎" },
    supplier: { title: "I have material.", subtitle: "Post it once. Let ReLoop find its best economic path.", icon: "📦" },
    buyer: { title: "I need material.", subtitle: "Publish demand. ReLoop assembles the supply around it.", icon: "🏗️" },
    kabadiwala: { title: "My material bank.", subtitle: "Turn local collection into structured inventory.", icon: "♻️" },
    collection: { title: "Collection command center.", subtitle: "Receive optimized jobs based on your capacity and location.", icon: "🚚" },
  };

  const current = roleData[role] || roleData.network;

  return (
    <div className="page">
      <div className="workspace-hero">
        <div className="workspace-icon">{current.icon}</div>
        <div>
          <span className="eyebrow">My ReLoop workspace</span>
          <h1>{current.title}</h1>
          <p>{current.subtitle}</p>
        </div>
      </div>

      {role === "kabadiwala" && <KabadiwalaOnboarding />}

      <div className="workspace-grid">
        <WorkspaceCard icon="📦" title="Post material" text="Add waste, quality, quantity and location." button="Post material" onClick={() => setShowAddWaste(true)} />
        <WorkspaceCard icon="🏗️" title="Post demand" text="Tell the network what material you need." button="Create demand" onClick={() => setShowDemand(true)} />
        <WorkspaceCard icon="🤖" title="AI opportunities" text="See matches, aggregation and price opportunities." button="Open AI" onClick={() => navigate("ai")} />
        <WorkspaceCard icon="🚚" title="Collection" text="Coordinate pickups and optimized routes." button="Open logistics" onClick={() => navigate("logistics")} />
        <WorkspaceCard icon="₹" title="Price intelligence" text="Understand network price and landed value." button="Explore prices" onClick={() => navigate("prices")} />
        <WorkspaceCard icon="📊" title="My impact" text="Track material, transactions and savings." button="View dashboard" onClick={() => navigate("dashboard")} />
      </div>

      <div className="workspace-flow">
        <span>Your role</span>
        <strong>Post / request</strong>
        <i>—</i>
        <strong>AI understands</strong>
        <i>—</i>
        <strong>Optimizer decides</strong>
        <i>—</i>
        <strong>Network executes</strong>
      </div>
    </div>
  );
}

function KabadiwalaOnboarding() {
  const steps = [
    { title: "List what you've already collected", text: "Add material, rough quantity and quality — even a phone photo estimate is enough to start." },
    { title: "Get matched to a buyer", text: "ReLoop checks your stock against open demand and shows you the best-paying feasible match." },
    { title: "Get picked up or deliver it", text: "Either a collection partner routes through you, or you deliver directly — whichever the optimizer says is cheaper." },
  ];

  return (
    <div className="onboarding">
      <span className="eyebrow">Getting started as a kabadiwala</span>
      <div className="onboarding-steps">
        {steps.map((s, i) => (
          <div className="onboarding-step" key={s.title}>
            <div className="onboarding-number">{i + 1}</div>
            <div>
              <b>{s.title}</b>
              <p>{s.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkspaceCard({ icon, title, text, button, onClick }) {
  return (
    <div className="workspace-card">
      <div className="workspace-card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="secondary-btn" onClick={onClick}>
        {button}
      </button>
    </div>
  );
}

/* -------------------------------------------------------
   MODALS
------------------------------------------------------- */

function useEscToClose(close) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
}

function ModalShell({ title, close, children }) {
  useEscToClose(close);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">ReLoop</span>
            <h2>{title}</h2>
          </div>
          <button className="close-btn" onClick={close} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddWasteModal({ close, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    role: "Industry",
    material: "Aluminium Scrap",
    quantity: "1000",
    quality: "Grade B+",
    location: "",
    price: "140",
  });

  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const valid = form.name.trim() && form.location.trim() && Number(form.quantity) > 0;

  return (
    <ModalShell title="I have material" close={close}>
      <div className="modal-intro">
        <div className="mini-ai">AI</div>
        <p>You give the basics. ReLoop turns it into a structured supply node and searches for buyers, price and logistics.</p>
      </div>

      <div className="form-grid">
        <Field label="Your name / business" value={form.name} onChange={(v) => update("name", v)} placeholder="e.g. ABC Industries" />
        <SelectField label="Source type" value={form.role} onChange={(v) => update("role", v)} options={sourceTypes.map((x) => x.name)} />
        <SelectField
          label="Material"
          value={form.material}
          onChange={(v) => update("material", v)}
          options={["Aluminium Scrap", "PET Plastic", "Paper & Cardboard", "Glass", "Textile Waste", "E-Waste", "Mixed Metals"]}
        />
        <Field label="Quantity (kg)" value={form.quantity} onChange={(v) => update("quantity", v)} type="number" />
        <SelectField label="Quality / grade" value={form.quality} onChange={(v) => update("quality", v)} options={["Grade A", "Grade B+", "Grade B", "Mixed / Unsorted"]} />
        <Field label="Location" value={form.location} onChange={(v) => update("location", v)} placeholder="City / area" />
        <Field label="Expected price ₹/kg" value={form.price} onChange={(v) => update("price", v)} type="number" />
      </div>

      <button className="primary-btn full" disabled={!valid} onClick={() => onSubmit(form)}>
        Analyse & connect material
      </button>
      {!valid && <small className="form-hint">Add your name, location and a quantity above zero to continue.</small>}
    </ModalShell>
  );
}

function DemandModal({ close, onSubmit }) {
  const [form, setForm] = useState({
    buyer: "",
    material: "Aluminium Scrap",
    quantity: "5000",
    quality: "Grade B+ or better",
    location: "",
    price: "148",
    deadline: "",
  });

  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const valid = form.buyer.trim() && form.location.trim() && Number(form.quantity) > 0;

  return (
    <ModalShell title="I need material" close={close}>
      <div className="modal-intro">
        <div className="mini-ai">AI</div>
        <p>Define your requirement. ReLoop searches the network and decides whether it's best fulfilled directly or through aggregation.</p>
      </div>

      <div className="form-grid">
        <Field label="Buyer / business" value={form.buyer} onChange={(v) => update("buyer", v)} placeholder="e.g. EcoMetal Recycling" />
        <SelectField
          label="Material required"
          value={form.material}
          onChange={(v) => update("material", v)}
          options={["Aluminium Scrap", "PET Plastic", "Paper & Cardboard", "Glass", "Textile Waste", "E-Waste", "Mixed Metals"]}
        />
        <Field label="Quantity required (kg)" value={form.quantity} onChange={(v) => update("quantity", v)} type="number" />
        <SelectField label="Required quality" value={form.quality} onChange={(v) => update("quality", v)} options={["Grade A", "Grade B+ or better", "Grade B", "Mixed acceptable"]} />
        <Field label="Delivery location" value={form.location} onChange={(v) => update("location", v)} placeholder="City / industrial area" />
        <Field label="Target price ₹/kg" value={form.price} onChange={(v) => update("price", v)} type="number" />
        <Field label="Required by" value={form.deadline} onChange={(v) => update("deadline", v)} placeholder="e.g. 20 Sep" />
      </div>

      <button className="primary-btn full" disabled={!valid} onClick={() => onSubmit(form)}>
        Find my supply
      </button>
      {!valid && <small className="form-hint">Add a buyer name, location and a quantity above zero to continue.</small>}
    </ModalShell>
  );
}

function DetailModal({ supply, demand, close }) {
  const isSupply = Boolean(supply);
  const data = supply || demand;

  return (
    <ModalShell title={isSupply ? "Supply node" : "Buyer demand"} close={close}>
      <h2 style={{ marginTop: 0 }}>{data.material}</h2>

      {isSupply ? (
        <>
          <div className="detail-summary">
            <div><small>Available</small><strong>{kg(data.qty)}</strong></div>
            <div><small>Quality</small><strong>{data.quality}</strong></div>
            <div><small>Reference price</small><strong>₹{data.price}/kg</strong></div>
            <div><small>Distance</small><strong>{data.distance} km</strong></div>
          </div>
          <div className="ai-decision-card">
            <div className="mini-ai">AI</div>
            <div>
              <span className="eyebrow">Current status</span>
              <h3>{data.verified ? "Verified listing" : "Pending verification"}</h3>
              <p>ReLoop is evaluating direct buyer matches, aggregation opportunities and logistics economics for this supply.</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="detail-summary">
            <div><small>Required</small><strong>{kg(data.qty)}</strong></div>
            <div><small>Quality</small><strong>{data.quality}</strong></div>
            <div><small>Target price</small><strong>₹{data.targetPrice}/kg</strong></div>
            <div><small>Deadline</small><strong>{data.deadline}</strong></div>
          </div>
          <div className="ai-decision-card">
            <div className="mini-ai">AI</div>
            <div>
              <span className="eyebrow">Supply search</span>
              <h3>{data.verified ? "Verified buyer" : "Pending verification"}</h3>
              <p>ReLoop is building a feasible supply batch from industries, businesses, households and kabadiwala inventory. See it on the AI Opportunities page.</p>
            </div>
          </div>
        </>
      )}

      <div className="modal-actions">
        <button className="secondary-btn" onClick={close}>Close</button>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   COMMON COMPONENTS
------------------------------------------------------- */

function PageHeader({ eyebrow, title, text }) {
  return (
    <div className="page-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function SectionHeading({ title, subtitle, light }) {
  return (
    <div className={light ? "section-heading light" : "section-heading"}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function ProcessFlow() {
  const steps = [
    ["Post", "Supply or demand enters the network"],
    ["Understand", "The system reads material, quality and intent"],
    ["Match", "Find technically compatible nodes"],
    ["Optimize", "Pick the lowest-cost feasible allocation"],
    ["Move", "Route collection and transport"],
    ["Settle", "Complete transaction and record impact"],
  ];

  return (
    <div className="process-flow">
      {steps.map(([title, text], index) => (
        <div className="process-step" key={title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      ))}
    </div>
  );
}

function WhyCard({ icon, title, value, text }) {
  return (
    <div className="why-card">
      <span>{icon}</span>
      <small>{title}</small>
      <strong>{value}</strong>
      <p>{text}</p>
    </div>
  );
}

function Stat({ value, suffix = "", prefix = "", label }) {
  const count = useCountUp(value);
  return (
    <div className="stat">
      <strong>{prefix}{count.toLocaleString("en-IN")}{suffix}</strong>
      <span>{label}</span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Footer({ navigate }) {
  return (
    <footer>
      <div className="footer-brand">
        <div className="brand-mark">
          <span>R</span>
        </div>
        <div>
          <strong>ReLoop</strong>
          <small>Turn waste into value</small>
        </div>
      </div>

      <div className="footer-center">
        <span>Greedy allocation engine</span>
        <span>Routing simulation</span>
        <span>Circular economy</span>
      </div>

      <button onClick={() => navigate("optimizer")}>Explore the decision engine</button>
    </footer>
  );
}

export default App;
