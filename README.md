# 🚀 AstroBuilder: Team Space Mission Designer

A bright, cartoon-styled interactive **1–4 Player Space Mission Design & Simulation Web Application** built with **React, Vite, Tailwind CSS, and Node.js/Express** (ready for one-click deployment on **Vercel**).

## ✨ Key Features

1. **1–4 Player Multiplayer Team Rooms & Scannable QR Code:**
   - Create or join a shared 4-letter **Mission Room** from any desktop or phone.
   - Scan the live **QR Code** to join the room immediately with `?room=CODE`.
   - **Automatic 4-Role Division:** Supports up to **4 players**. If fewer than 4 players join, the 4 roles (**🎖️ Mission Commander**, **🚀 Propulsion & Tank Engineer**, **🔬 Aero & Science Specialist**, and **🍱 Life Support & Food Officer**) are automatically divided among the players in the room (`1 player = 4 roles`, `2 players = 2 roles each`, `3 players = 2 + 1 + 1`, `4 players = 1 role each`).
   - **Shared Single Budget & Live Room Chat:** Every rocket part, science payload, and food ration deducts from a single shared team budget with real-time room chat.
2. **Top Mission Prep Progress Bar (`0%–100%`):**
   - Sleek top HUD bar tracking the 4 role readiness milestones (`25%` each). The rocket can only be launched once Mission Prep reaches `100%`.
3. **Interactive 8-Step Quick Demo Walkthrough:**
   - Clicking **Quick Demo Login** launches a guided step-by-step walkthrough that highlights and selects the required rocket parts, lunar core drill, astronaut food, and optimal trajectory before launch.
4. **3 Planetary Missions with Authentic Engineering Challenges:**
   - **🌕 Moon (`$1,000,000` Budget):** Mild thermal regime (`-20°C` night) — uses a light reflective fuel tank coating.
   - **🔴 Mars (`$3,000,000` Budget):** Cold `-65°C` interplanetary transit — requires mid-grade cryo-foam tank insulation and aero/heat protection.
   - **🔵 Neptune (`$7,000,000` Budget):** Extreme `-214°C` deep freeze — requires a heavy cryo-armored fuel tank, heat shield cone, and high-thrust Titan + Ion propulsion.
5. **Mobile & Web Ready (PWA):**
   - Responsive mobile tab switchers (`🛠️ Parts`, `🚀 Rocket`, `📊 Stats`) on phones (`<1024px`) and full 3-column layout on desktop.

## 🛠️ Local Development

```bash
npm install
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`

## ☁️ Deploying on Vercel

This repository includes `vercel.json` and `api/index.js` so both the React frontend and `/api/*` multiplayer room server deploy together on Vercel with zero configuration.
