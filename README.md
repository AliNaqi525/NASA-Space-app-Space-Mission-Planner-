# 🚀 AstroBuilder: Space Mission Design App

A bright, cartoon-styled interactive **Space Mission Design & Simulation Web Application** built with **React, Vite, Tailwind CSS, and Node.js/Express**.

## ✨ Features

1. **Spaceport Login, Signup & Astronaut Profile (`server/database.json`):**
   - Persistent user accounts saving logins, career scores, completed missions, and assigned Team Roles (Solo Mode active now; roles ready for Team Mode).
2. **3 Planetary Missions with Authentic Engineering Challenges:**
   - **🌕 Moon (`$1,000,000` Budget):** Mild thermal regime (`-20°C` night) — uses a light, economical reflective fuel tank coating.
   - **🔴 Mars (`$3,000,000` Budget):** Cold `-65°C` interplanetary transit — requires mid-grade cryo-foam tank insulation and aero/heat protection.
   - **🔵 Neptune (`$7,000,000` Budget):** Extreme `-214°C` deep freeze — requires a heavy, thick cryo-armored fuel tank, heat shield cone, and high-thrust Titan + Ion propulsion.
3. **2D Cartoon & Blueprint Rocket Builder:**
   - Select **Nose Cones**, **Fuel Tanks**, **Thermal Tank Coatings**, **Fins**, **Rocket Engines**, and **Science Experiments** (each with weight, cost, thrust, and science score).
   - Toggle between the **Sunny Launchpad View** and **2D Technical Blueprint Grid**.
4. **Astronaut Food & Life Support Provisioning:**
   - Purchase crew rations with leftover budget. Food weight adds to total rocket mass and incurs a launch fuel surcharge (`+$45/kg`).
5. **Pre-Flight Trajectory & Space Flight Simulator (SFS) Animation:**
   - Configure **Launch Angle (`0°–90°`)** and **Transfer Trajectory** before liftoff (`≥40%` accuracy passes; `<40%` provides scientific facts and suggested corrections).
   - Watch the 2D **Space Flight Simulator** vertical ascent and **Solar System** transfer animation.
   - Detailed **Crash / Failure Diagnostics** explain the exact root cause and take you directly back to the page needed to fix it (**Food Page** or **Rocket Builder**).

## 🛠️ Quick Start

```bash
npm install
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
