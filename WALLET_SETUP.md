
## 🧠 **Bitredict Reputation-Gated Prediction Market System (v1)**

### 🔍 **Core Idea**

Bitredict starts with a **guided and secure prediction market** limited to **football matches** and **cryptocurrency prices**, backed by **external oracle APIs**.
Over time, as users build **reputation**, they unlock access to **more flexible, open-ended markets** (e.g. politics, sports awards, custom events).

---

## 🧱 **System Architecture**

### 1. **Market Types**

| Type                      | Description                                                  | Data Source                                    | Access           |
| ------------------------- | ------------------------------------------------------------ | ---------------------------------------------- | ---------------- |
| 🟢 **Guided Markets** | Oracle-backed football & coin predictions                    | Sportmonks (football), Coingecko (crypto)      | Open to all      |
| 🔓 **Open Markets**       | Custom events (e.g. “Will ETH hit \$5k?”, “Will Trump win?”) | No oracle (resolved by proposals & challenges) | Reputation-gated |

--5

### 2. **User Reputation System**

All users have a **single reputation score (0–150)**, tracking their reliability and contribution across the platform.

#### 🧾 Reputation Actions & Points

| Action                                      | Points     |
| ------------------------------------------- | ---------- |
| ✅ Proposed correct outcome (matched oracle) | +10        |
| ❌ Proposed incorrect outcome                | -15        |
| ✅ Successfully challenged incorrect outcome | +10        |
| ❌ Failed challenge                          | -8         |
| ✅ Created a  market   filled more than 60%                  | +8         |
| ❌ Created a faulty/spam market              | -12        |
| ✅ Placed and won  bet with +10 STT / +2000 BITR            | +5  |

> All users start with a **default score of 40**.
> The score is stored off-chain and updated after every key action.

---

### 3. **Access Levels Based on Reputation**

| Reputation Score | Role     | Capabilities                          |
| ---------------- | -------- | ------------------------------------- |
| 🔴 0–39          | Limited  | Can only place bets                   |
| 🟡 40–99         | Elementary     | Can bet and create guided markets |
| 🟢 100–149         | Trusted  | Can propose outcomes in open markets  |
| 🟣 150+           | Verified | Can create & resolve open markets     |

---

### 4. **How Outcome Resolution Works**

#### 🔹 In Guided Markets:

* Outcome is resolved **automatically** using trusted oracle APIs (e.g. Coingecko, Sportmonks).
* Users can propose outcomes, but if there's a conflict, the oracle result is final.

#### 🔸 In Open Markets:

* Outcome is **proposed** by a trusted user (rep ≥ 100).
* Others can **challenge** within a set time window (e.g. 12–24 hours).
* If challenged, final resolution is decided either by:

  * Multiple high-reputation users agreeing,
  * or a decentralized voting system (DAO) in future.

---

### 5. **Market Creation Flow**

#### 🟢 Guided Market (e.g. Football):

* User picks from pre-fetched API data (match ID, teams, date).
* No need to manually input match data.
* Outcome is linked to an external ID (e.g. `match_id` from Sportmonks).

#### 🔓 Open Market:

* High-reputation users create a custom event (e.g., “Will Solana hit \$200 by July 15?”).
* They define:

  * Asset or condition
  * Comparison logic (gt/lt/eq)
  * Expiry timestamp
* Outcome to be proposed and possibly challenged after expiry.

---

### 6. **Security Features**

* **No outcome proposals from low-rep users.**
* **Only whitelisted coins/matches can be used in controlled markets.**
* **Timestamp locking** prevents creating markets too close to the event.
* Oracle fallback always available for football and coins.
* System is designed for **progressive decentralization**:

  * Centralized oracle → partial user trust → full community trust.

---

### 🧩 Optional Enhancements

* **User badges**: display role/status based on reputation.

* **Reputation decay**: inactive or abusive users lose points over time.

---

## ✅ Summary

Bitredict starts with **trust-minimized, API-secured markets**, gradually allowing more **flexibility and decentralization** based on user behavior. Reputation is the backbone for:

* Access control
* Outcome reliability
* Platform governance (eventually)

It’s a **scalable, tamper-resistant, and user-aligned system** that balances openness with protection.

---





