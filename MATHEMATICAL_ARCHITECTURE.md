# Zen Sudoku — Mathematical Architecture & Algorithm Logic

This document details all mathematical logic, bitwise operations, graph structures, rating systems, database indexing, conflict detection, feedback systems, and game scoring formulas used in **Zen Sudoku**.

---

## 1. Grid Representation & Coordinate Mathematics

A standard Sudoku board consists of $81$ cells arranged in a $9 \times 9$ matrix.

### 1.1 Flat Array Indexing (Row-Major Order)
Rather than a 2D matrix (`grid[row][col]`), the board is stored as a 1-dimensional array of 81 elements ($i \in [0, 80]$):

$$\text{index}(r, c) = 9 \cdot r + c$$

Where:
- Row $r = \lfloor i / 9 \rfloor \in \{0, 1, \dots, 8\}$
- Column $c = i \bmod 9 \in \{0, 1, \dots, 8\}$
- Box $b = 3 \cdot \lfloor r / 3 \rfloor + \lfloor c / 3 \rfloor \in \{0, 1, \dots, 8\}$

### 1.2 Constraint Graph & Peer Relations
Sudoku can be modeled as a **Graph Coloring Problem** where each cell is a vertex and edges connect cells in the same row, column, or $3 \times 3$ box unit:

- **Rows ($R_r$)**: $9$ sets of $9$ cells each.
- **Columns ($C_c$)**: $9$ sets of $9$ cells each.
- **Boxes ($B_b$)**: $9$ sets of $9$ cells each.

For any cell $i$, its peer set $\mathcal{P}_i$ is the union of its containing row, column, and box units (excluding $i$ itself):

$$\mathcal{P}_i = (R_{r(i)} \cup C_{c(i)} \cup B_{b(i)}) \setminus \{i\}$$

Each cell has exactly **$20$ unique peers** ($8$ in row + $8$ in col + $4$ remaining in box).

---

## 2. Fast Bitwise Candidate Representation

To determine valid values for an empty cell, candidate numbers $v \in \{1, \dots, 9\}$ are stored using **16-bit binary masks** for constant-time $O(1)$ operations:

$$\text{Bitmask for value } v = 1 \ll v$$
$$\text{Full Candidate Mask (all digits 1..9)} = \sum_{v=1}^{9} 2^v = 0\text{b}1111111110 = 1022_{10}$$

### 2.1 Bitwise Operations
- **Remove candidate $v$**: $\text{mask} \gets \text{mask} \ \& \ \sim(1 \ll v)$
- **Check candidate $v$**: $(\text{mask} \ \& \ (1 \ll v)) \neq 0$
- **Population Count (popcount)**: Number of available candidates for cell $i$:
  $$\text{popcount}(m) = \text{number of set bits in } m$$
  Implemented via Brian Kernighan / SWAR bitwise arithmetic:
  ```ts
  export function popcount(m: number): number {
    m = m - ((m >> 1) & 0x55555555);
    m = (m & 0x33333333) + ((m >> 2) & 0x33333333);
    return (((m + (m >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
  }
  ```

---

## 3. Solver Algorithm & Uniqueness Mathematics

### 3.1 Backtracking with MRV Heuristic
The solver uses **Minimum Remaining Values (MRV)** heuristic combined with bitmask constraints. At each decision step:

$$\text{Choose empty cell } i^* = \arg\min_{\{i \mid g[i] = 0\}} \text{popcount}(\text{cand}[i])$$

If $\text{popcount}(\text{cand}[i^*]) = 0$ for any empty cell, the branch dead-ends immediately and backtracks.

### 3.2 Unique Solution Verification
A valid Sudoku puzzle **must have exactly one unique solution** ($N_{\text{solutions}} = 1$).

`countSolutions(grid, limit = 2)` stops searching immediately as soon as a 2nd valid solution is found ($N = 2$), operating in $O(1)$ expected time during hole digging.

### 3.3 Progressive Clue Floor Formula Across 10 Levels
For each difficulty category $d \in \{\text{easy}, \text{medium}, \text{hard}, \text{expert}\}$ and level $L \in \{1, 2, \dots, 10\}$, the minimum clue count (hole digging floor) $C_{\text{floor}}(d, L)$ is calculated by:

$$\text{step}(L) = \min(9, \max(0, L - 1))$$

$$C_{\text{floor}}(\text{easy}, L) = \max\left(34, 42 - \lfloor 0.8 \cdot \text{step}(L) \rfloor\right)$$

$$C_{\text{floor}}(\text{medium}, L) = \max\left(28, 35 - \lfloor 0.8 \cdot \text{step}(L) \rfloor\right)$$

$$C_{\text{floor}}(\text{hard}, L) = \max\left(22, 28 - \lfloor 0.7 \cdot \text{step}(L) \rfloor\right)$$

$$C_{\text{floor}}(\text{expert}, L) = \max\left(17, 23 - \lfloor 0.6 \cdot \text{step}(L) \rfloor\right)$$

Where Level 10 on `expert` targets $17$ clues — the theoretical mathematical minimum for any valid $9 \times 9$ Sudoku grid with a unique solution.

---

## 4. Logical Technique Rater (Difficulty Rating)

Puzzles are rated strictly by the **hardest human logical technique** required to solve them without guessing:

| Technique | Rank | Mathematical / Set Condition |
| :--- | :---: | :--- |
| **Naked Single** | 1 | $\text{popcount}(\text{cand}[i]) = 1$ |
| **Hidden Single** | 2 | $\exists v \in \{1..9\}, \text{unit } U : |\{i \in U \mid v \in \text{cand}[i]\}| = 1$ |
| **Naked Pair** | 3 | $\exists i_1, i_2 \in U : \text{cand}[i_1] = \text{cand}[i_2] \land \text{popcount} = 2$ |
| **Pointing Pair** | 3 | Candidates for digit $v$ in Box $B$ lie entirely within single Row $R$ |
| **Box-Line Reduction** | 3 | Candidates for digit $v$ in Row $R$ lie entirely within single Box $B$ |
| **Hidden Pair** | 4 | 2 digits $v_1, v_2$ in unit $U$ appear only within 2 identical cells |
| **X-Wing** | 5 | Digit $v$ appears in exactly 2 cols in Row $R_1$ and identical 2 cols in Row $R_2$ |

---

## 5. Scoring System Formula

When a user completes a puzzle, their score $S$ is calculated using the following mathematical breakdown:

$$S = \max\left(0, B + T_{\text{bonus}} - P_{\text{mistakes}} - P_{\text{hints}} + B_{\text{perfect\_mistakes}} + B_{\text{perfect\_hints}}\right)$$

### 5.1 Variable Breakdown

1. **Base Score ($B$)**:
   - Easy: $200$ pts
   - Medium: $400$ pts
   - Hard: $800$ pts
   - Expert: $1500$ pts

2. **Time Target ($T_{\text{target}}$)**:
   - Easy: $300\text{s}$ ($5\text{ min}$)
   - Medium: $600\text{s}$ ($10\text{ min}$)
   - Hard: $1200\text{s}$ ($20\text{ min}$)
   - Expert: $1800\text{s}$ ($30\text{ min}$)

3. **Time Bonus ($T_{\text{bonus}}$)**:
   $$T_{\text{bonus}} = \max\left(0, \left\lfloor 0.6 \cdot B \cdot \left(1 - \min\left(1, \frac{t_{\text{seconds}}}{T_{\text{target}}}\right)\right) \right\rfloor\right)$$

4. **Penalties**:
   - Mistake Penalty: $P_{\text{mistakes}} = 50 \cdot n_{\text{mistakes}}$
   - Hint Penalty: $P_{\text{hints}} = 100 \cdot n_{\text{hints}}$

5. **Bonuses**:
   - No Mistake Bonus: $B_{\text{perfect\_mistakes}} = \begin{cases} \lfloor 0.2 \cdot B \rfloor & \text{if } n_{\text{mistakes}} = 0 \\ 0 & \text{otherwise} \end{cases}$
   - No Hint Bonus: $B_{\text{perfect\_hints}} = \begin{cases} \lfloor 0.2 \cdot B \rfloor & \text{if } n_{\text{hints}} = 0 \\ 0 & \text{otherwise} \end{cases}$

### 5.2 Score Floor & Zero XP Behavior

The score is **clamped to $\geq 0$** by the $\max(0, \dots)$ wrapper. When $n_{\text{mistakes}}$ is large enough that penalties exceed total bonuses, the displayed score is $0$ XP. This is intentional — high mistake counts reflect unsuccessful play. The UI explicitly shows `0 XP — too many mistakes` in this case rather than `+0 XP` to make the outcome clear.

**Example**: Easy puzzle, 9 mistakes, 0 hints, 6:52 time:
$$S = \max(0,\ 200 + 0 - 450 - 0 + 0 + 40) = \max(0,\ -210) = 0$$

---

## 6. Solution-Aware Conflict Detection

### 6.1 Old Approach (Peer-Duplicate Scanning)
The naive approach scanned each row/col/box for duplicate values on the live board:

$$\text{conflict}(i) = \exists j \in \mathcal{P}_i : g[j] = g[i] \land g[i] \neq 0$$

**Problem**: If a player left a wrong value $v_w$ at cell $j$ and later entered the correct value $v_c = v_w$ at cell $i$ (same unit), both cells would be flagged as conflicts — including the **correct** cell.

### 6.2 Current Approach (Solution Comparison)
Each user-entered cell is compared directly against the known solution:

$$\text{conflict}(i) = \neg \text{given}(i) \land g[i] \neq 0 \land g[i] \neq s[i]$$

Where $s[i]$ is the pre-computed solution value at position $i$. This guarantees:
- Correct entries are **never** highlighted red, regardless of what other cells contain.
- Only genuinely wrong entries are marked as conflicts.
- The solution array $s$ is **never mutated** after puzzle generation.

---

## 7. Wrong-Entry Feedback System

When a player enters a digit that does not match the solution, three simultaneous feedback signals fire:

1. **Error sound**: Web Audio API tone synthesized client-side.
2. **Shake animation**: CSS `@keyframes shakeError` applied for $350\text{ms}$ via `flashIdx` state:
   $$\text{translateX}(t) = \begin{cases} -4\text{px} & t \in [20\%, 60\%] \\ +4\text{px} & t \in [40\%, 80\%] \\ 0 & t = 0\% \text{ or } 100\% \end{cases}$$
3. **Haptic vibration** (mobile): `navigator.vibrate(80)` — $80\text{ms}$ pulse, gated behind the `haptics` setting and API availability check.

The `flashIdx` state is set to the cell index on mistake and cleared after $350\text{ms}$ via `setTimeout`, keeping the animation atomic and non-blocking.

---

## 8. Seeded Pseudo-Random Number Generator (Mulberry32)

To ensure reproducible daily puzzles and seeded game replays, a 32-bit Mulberry32 PRNG is used instead of non-deterministic `Math.random()`:

$$a_{k+1} = (a_k + \text{0x6D2B79F5}) \bmod 2^{32}$$
$$t = \text{imul}(a_{k+1} \oplus (a_{k+1} \gg 15), a_{k+1} \mid 1)$$
$$t = t \oplus (t + \text{imul}(t \oplus (t \gg 7), t \mid 61))$$
$$\text{rand}() = \frac{(t \oplus (t \gg 14)) \gg 0}{4294967296}$$

---

## 9. Database Relational Model & Leaderboard Indexing

Zen Sudoku uses **Neon PostgreSQL** serverless storage with **Drizzle ORM**.

### 9.1 Relational Schema
- **`users`**: Stores UUID v4, username, and timestamps. Lookups operate in $O(1)$ via primary key index.
- **`statistics`**: Stores aggregate user stats ($N_{\text{played}}$, $N_{\text{won}}$, win rate %, streak metrics, best solve times).
- **`leaderboard`**: Stores period-scoped scores ($S$) and solve times ($t$).

### 9.2 Leaderboard Ranking Complexity
Global and period rankings use composite B-Tree indexes over `(period, score DESC, solve_time_ms ASC)`:

$$\text{Rank}(u) = 1 + |\{v \in U \mid S_v > S_u \lor (S_v = S_u \land t_v < t_u)\}|$$

Queries run in $O(\log N + K)$ time where $K$ is the requested page size ($K = 50$).

---

## 10. Mobile Viewport & Typography Scaling Mathematics

To eliminate scrolling on mobile viewports ($W \le 768\text{px}$), font scaling and cell sizes are calculated dynamically:

### 10.1 Cell Font Scaling
$$\text{Font Size} = \min(4.5\text{vw}, 26\text{px}) \cdot \text{scale}$$

### 10.2 Touch Target Constraints
Every interactive button on mobile satisfies the Apple Human Interface Guidelines floor constraint:

$$\text{Touch Target Height} \ge 48\text{px} \quad (3 \text{rem})$$

### 10.3 Dedicated Mobile Layout Breakpoint
The single-viewport mobile layout activates at:

$$W_{\text{mobile}} \le 768\text{px}$$

At this breakpoint: footer is hidden, fullscreen controls are suppressed, and the game board occupies the maximum available vertical space with the keypad anchored directly below.
