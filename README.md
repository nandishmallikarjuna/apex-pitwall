# APEX PITWALL — Formula 1 Strategy Decision System

> **Tactical Pitwall Decision System for High-Stakes Grand Prix Scenarios**  
> An interactive hackathon prototype designed to help race engineers evaluate, stress-test, and commit to optimal pit-stop calls when weather, degradation, and Safety Car windows diverge unexpectedly.

---

## 🏁 The Preloaded Championship Scenario

- **Lap**: 31 of 53
- **Our Driver**: P3 (Car #7, Apex Velocity)
- **Tire Condition**: Hard compound, 22 laps old, wear accelerating (>68%)
- **Weather Threat**: Weather radar detects incoming rain cell; precipitation expected around Lap 35 (crossover window approaching)
- **Safety Car**: Neutralization deployed on Lap 31 following Turn 8 incident (estimated 3 laps remaining). Green-flag pit loss is ~23.5s; SC pit loss is only ~12.2s (saving ~11.3s!)
- **Rivals**:
  - **P1 (C. Sterling)**: Staying out to protect track position
  - **P2 (M. Keller)**: Unexpected dive into the pits for fresh Softs
  - **P4 (L. Rossi)**: Pits immediately for Intermediates gamble
- **Stakes**: One wrong strategic call could forfeit the championship title.

---

## 🚀 Quick Start & Setup Instructions

### Prerequisites
- **Node.js**: `v18.0.0` or later (tested on Node v24.x)
- **Package Manager**: `npm` (v9+) or `pnpm`

### Installation & Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Run unit tests**:
   ```bash
   npm test
   ```
   Executes 9 unit tests across wetness calculations, Safety Car delta savings, rain crossover adaptation, rival pace projections, and fuel compliance feasibility.

4. **Production Build**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🗺️ Required Circuits (Interactive 3D & 2D Overhead Map)

Switch seamlessly between four distinct Grand Prix circuits in the top navigation:

1. **Azerbaijan — Baku City Circuit**: 6.003 km, 20 turns, high-speed 2.2 km Neftchilar Avenue straight, tight Old City Castle section (T8–T12).
2. **Madrid — Madring (IFEMA)**: 5.474 km, 20 turns, modern hybrid street circuit featuring the steep banked *Curva Monumental* and M-40 tunnel.
3. **Monaco — Circuit de Monaco**: 3.337 km, 19 turns, iconic narrow harbor circuit (Sainte-Dévote, Casino, Fairmont Hairpin, Tunnel, Swimming Pool, Rascasse).
4. **Singapore — Marina Bay Street Circuit**: 4.940 km, 19 turns, bumpy night circuit with high humidity, Anderson Bridge, and extreme pit lane transit delta (~29.5s).

*Note: Circuit track paths are rendered as procedural schematic reconstructions (honestly labeled) to ensure lightweight browser rendering and avoid intellectual property infringement.*

### 3D Track Controls:
- **Orbit & Pan**: Click and drag on the track viewport.
- **Zoom**: Scroll wheel or `Zoom In` / `Zoom Out` buttons.
- **Overhead Map View**: Toggle the `OVERHEAD MAP` button for a crisp 2D tactical layout.
- **Follow Car Cam**: Click `FOLLOW #7` to lock camera into third-person chase perspective.
- **Reset Camera**: Click the reset icon (`RotateCcw`).

---

## 🧠 The Strategy Engine & Physics Model

The app runs an authentic, deterministic lap-by-lap simulation across all remaining race laps (Lap 31 to 53). It never uses hardcoded outcomes; all rankings and deltas recalculate immediately upon parameter adjustments.

### 1. Pace Formula
$$\text{LapTime} = T_{\text{base}} + \Delta_{\text{compound}} + \text{DegPenalty}(\text{wear}\%) + \text{Mismatch}(\text{compound}, \text{wetness}\%) - \Delta_{\text{fuel}}$$

- **Fuel Burn Advantage**: Burning ~1.5 kg of fuel per lap lightens the car, yielding ~0.032s/lap pace gain.
- **Tire Performance Cliff**: Wear under 60% incurs linear degradation; wear above 60% suffers exponential loss ($+0.45\text{s} \times (\text{wear}-60)^{2.1}$).
- **Wet Surface Mismatch**: Slicks lose grip quadratically when track wetness exceeds 18%.
- **Thermal Inters Penalty**: Running Intermediates on dry tarmac (<25% wetness) causes thermal overheating (+2.5s to +4.5s/lap) and triples tire wear.

### 2. Candidate Strategies Compared
1. **Plan A (Stay Out)**: Protect track position with zero immediate time loss; gamble that rain arrives late or misses.
2. **Plan B (Pit NOW for Intermediates)**: Exploit the cheap ~12.2s Safety Car pit delta and prep rubber ahead of the forecast rain.
3. **Plan C (Pit NOW for Fresh Dry Tires)**: Bank the cheap SC pit stop for fresh Mediums; attack rivals on fresh rubber if rain dissipates.
4. **Plan D (Pit NOW for Full Wets)**: Extreme weather safeguard against sudden monsoon inundation.
5. **Plan E (Delay Pit Stop to Lap X)**: Stay out under SC; pit directly at the verified crossover lap to eliminate dry thermal blistering.

### 3. Safety Car Advantage (No Double Counting)
Under Safety Car, pack speeds are locked to 138% of base lap time. Pitting under SC incurs `scPitLaneDeltaSec` (~11.2s–15.2s) instead of green-flag `pitLaneDeltaSec` (~21.0s–29.5s), saving 10 to 14 seconds without double-counting track position or pit losses.

### 4. Feasibility & FIA Compliance
- **Fuel Reserve**: Strategies leaving less than the mandatory FIA 1.0 kg fuel inspection sample buffer at race finish are flagged **`INFEASIBLE`** (disqualification risk).
- **Wear Limit**: End-of-race wear $\ge 96\%$ triggers **`HIGH_RISK`** warnings (puncture hazard).

---

## 🎛️ Decision Features & Dashboard Tools

- **Scenario Presets**:
  - *Championship Decider* (Default: Lap 31/53, P3, SC deployed, rain approaching)
  - *Dry High-Deg Sprint* (Zero rain, green flag, extreme deg undercut battle)
  - *Sudden Heavy Deluge* (Monsoon hits Lap 32, 92% track wetness, full wet tires)
  - *Late Safety Car Window* (Lap 44/53 sprint, 9 laps to flag, tire gamble)
  - *High Tire Degradation Crisis* (Thermal blistering on worn rubber)
  - *Low Fuel Reserve* (Fuel deficit, lift-and-coast requirement)
- **What-If Scenario Comparator**: Save a baseline snapshot as *Scenario A*, edit parameters for *Scenario B*, and view side-by-side time deltas, compound choices, and diagnostic root causes ("Why the call flipped").
- **Rival Grid Monitor**: Track and edit rivals P1, P2, P4, and P5. Change their pit stop decisions to observe real-time undercut/overcut position projections.
- **Strategy Visual Charts**:
  - *Lap-by-Lap Pace Forecast*: Shows pit stop spikes, SC pace plateaus, and deg curves.
  - *Tire Wear Progression*: Features the 70% performance cliff and 100% failure boundaries.
  - *Weather Radar & Crossover*: Precipitation curve with Slick-Inter (25%) and Full Wet (68%) crossover points.
  - *Race Time Delta Comparison*: Horizontal delta bars with $\pm \sigma$ confidence whiskers.
- **Dynamic Event Timeline**: State-driven incident log (SC deployment, rival box calls, rain detections, tire wear alerts).
- **Decision Audit Log & CSV Export**: Timestamped record of strategy runs. One-click RFC 4180 CSV export for race engineering debriefs.
- **Web Audio FX**: Native Web Audio API radio beeps, SC siren alerts, and telemetry clicks (toggleable via the audio button).

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|:---|:---|
| `Space` | Step simulation forward by 1 lap (`+1 Lap`) |
| `R` | Reset to opening Championship Decider scenario |
| `W` | Open What-If Scenario Comparator (`A/B`) |
| `M` | Open Model Assumptions & Math Specification modal |
| `S` | Toggle Pit-Wall Audio FX Mute |

---

## 🔍 Data Source Classification & Integrity

| Data Type | Description |
|:---|:---|
| **Calibrated Benchmarks** | Track length, turns, green-flag vs SC pit loss transit deltas, base lap times, FIA 1.0kg fuel sample minimum. |
| **User Estimates** | Rain forecast lap, peak intensity, SC duration, thermal deg multiplier, pit delay laps. |
| **Generated Demo Data** | Rival pace offsets, procedural 3D circuit elevation splines. Explicitly labeled: **DEMO DATA // NOT FIA TELEMETRY**. |

---

## ⚠️ Known Model Limitations

1. **Schematic Geometry**: Track splines are procedural 3D approximations designed for performant browser rendering without proprietary CAD assets.
2. **Simplified Aero Tow**: Slipstream and DRS trains are modeled as compound pace deltas rather than multi-body computational fluid dynamics.
3. **Rival AI**: Rivals follow modeled strategic archetypes rather than reactive neural agents.
4. **Independent Branding**: Built as an original hackathon prototype. Not affiliated with or endorsed by Formula 1, Formula One Licensing B.V., or the FIA.
