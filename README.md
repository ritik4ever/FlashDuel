#  FlashDuel — 1v1 Crypto Trading Battles

**ETHGlobal 2025 | Powered by Yellow Network**

FlashDuel is a fast, skill‑based **1v1 crypto trading game**. Two players stake the same USDC, trade real market prices for a few minutes, and the **better trader wins the pot**.

No gas during gameplay. Trades are instant. Settlement is trustless.

---

## What is FlashDuel?

* Create or join a 1v1 match
* Both players stake **equal USDC**
* Trade **ETH / BTC / SOL** at live prices
* When the timer ends, **higher portfolio value wins**
* **Winner takes 95%**, platform fee **5%**

Wallet address = player identity. No profiles needed for MVP.



##  Why It’s Different

* **Instant trades** (real‑time updates)
* **Zero gas while trading**
* **On‑chain escrow** for stakes
* **Pure skill** — same starting balance for both players
* **Powered by Yellow Network Nitrolite SDK** for state‑channel based off‑chain execution

---

##  Game Flow (Simple)

1. Player A creates a match (stakes USDC)
2. Player B joins the match (same stake)
3. 5‑minute trading battle starts
4. Both trade ETH / BTC / SOL at live prices
5. Timer ends → portfolio values compared
6. Winner receives 95% of the pool

---

##  How Trading Works

* Both players start with identical USDC
* Buy / sell at real‑time prices
* Portfolio updates instantly for both players
* No on‑chain transactions during the match
* Final result is settled on‑chain

---

## 🧾 Deployed Contracts (Sepolia)

**Mock USDC (USDC)**

* Address: https://sepolia.etherscan.io/token/0x9fa9f632f2b6afcbb112ee53d2638202efe9b71a
* Mintable test token
* Token name: Mock USDC (USDC)

**FlashDuel Contract**

* Address: https://sepolia.etherscan.io/address/0x7c1d47ed0afc7efcc2d6592b7da3d838d97a00b4
* Handles match creation, stake locking, and settlement

Network: **Sepolia Ethereum**

---

## 🛠 Tech Stack

* **Frontend:** Next.js 14, React, Tailwind CSS
* **Wallet:** RainbowKit, wagmi, viem
* **Prices:** CoinGecko (real‑time)
* **Trading:** WebSocket (off‑chain)
* **Settlement:** Ethereum smart contracts
* **State Channels:** Yellow Network (Nitrolite SDK)

---

## 🏗 Architecture (High Level)

* Funds are deposited once and secured via smart contracts
* Matches and trades run **off‑chain using Yellow Network’s Nitrolite SDK**
* Trades are signed with session keys and coordinated via ClearNode
* This enables **instant, gasless state updates** during gameplay
* Final match state is **settled on‑chain** for trustless payouts

---

## 🏆 Why It Works for Hackathons

* Real money escrow (not paper trading)
* Multiplayer, real‑time gameplay
* Zero‑gas trading experience
* Clear winner logic
* Strong Web3 + infra story

---

## 📌 Status

* Contracts deployed on Sepolia
* Lobby + trading arena live
* Matches visible in real time
* Waiting for users to create matches

---

## 👤 Team

**Ritik** — Full‑Stack & Web3 Developer
GitHub: [https://github.com/ritik4ever](https://github.com/ritik4ever)
Email: [ritikzoom4ever@gmail.com](mailto:ritikzoom4ever@gmail.com)

---

Built for speed. Won by skill. ⚔️

