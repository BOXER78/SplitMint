# 🍃 SplitMint

**SplitMint** is a premium, AI-powered expense splitting web application designed with elegance and clarity in mind. Built with a modern **Minty Fresh UI**, it allows users to create accounts, manage shared expenses online, track balances, and gain intelligent financial insights from anywhere.

![SplitMint Preview](https://via.placeholder.com/800x400?text=SplitMint+Expense+Management) <!-- I'll use a placeholder for now as I can't generate a real screenshot of the running app yet, but the description will be vivid -->

## ✨ Features

- **🚀 User Accounts**: Create your personal account to sync your expenses and groups across devices.
- **🏠 Group Management**: Create and manage multiple groups for trips, roommates, or events.
- **💸 Smart Expense Splitting**: Add expenses and let the engine calculate who owes whom.
* **📊 Visual Dashboards**: Interactive charts and graphs powered by Recharts to visualize spending patterns.
* **🤖 MintSense AI**: Powered by Anthropic Claude, providing intelligent insights into your spending habits and debt-settling advice.
* **🔐 Secure Auth**: Robust authentication using JWT and bcrypt for protected user data.
* **💎 Premium Aesthetics**: A "Minty Fresh" design system featuring glassmorphism, smooth gradients, and a sleek dark mode.

## 🚀 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: Next.js API Routes, [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Production) / [SQLite](https://www.sqlite.org/) (Local)
- **AI**: [Anthropic Claude API](https://www.anthropic.com/) (MintSense AI)
- **Icons & UI**: [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BOXER78/SplitMint.git
   cd SplitMint
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   DATABASE_URL="your-postgresql-url"
   JWT_SECRET="your-secret-key"
   ANTHROPIC_API_KEY="your-anthropic-key"
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧠 MintSense AI

SplitMint isn't just a calculator. With **MintSense**, you get:
- Personalized summaries of group spending.
- Suggestions on the most efficient way to settle balances.
- AI-driven alerts for unusual spending peaks.

## 🎨 Design Philosophy

SplitMint utilizes the **Minty Fresh UI** system:
- **Primary Color**: HSL(160, 84%, 39%) - *Mint Green*
- **Accents**: Soft glassmorphism and deep indigo shades.
- **Typography**: Clean, sans-serif fonts (Inter/Outfit) for maximum readability.

---

Built with ❤️ by the SplitMint Team.
