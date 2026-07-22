# Zen Sudoku — Mathematical Architecture & Algorithm Logic

This document details all mathematical logic, bitwise operations, graph structures, rating systems, and game scoring formulas used in **Zen Sudoku**.

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

### 3.3 Symmetric Hole Digging
Puzzles are created by starting from a complete valid board $S$ and digging symmetric cell pairs $(i, 80 - i)$:

$$\text{symmetric\_peer}(i) = 80 - i$$

If setting $g[i] = 0$ and $g[80-i] = 0$ causes $\text{countSolutions}(g, 2) \neq 1$, the digits are restored and skipped.

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

If no logic technique advances the grid state, the solver falls back to backtracking, classifying the puzzle as `expert`.

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

---

## 6. Seeded Pseudo-Random Number Generator (Mulberry32)

To ensure reproducible daily puzzles and seeded game replays, a 32-bit Mulberry32 PRNG is used instead of non-deterministic `Math.random()`:

$$a_{k+1} = (a_k + \text{0x6D2B79F5}) \bmod 2^{32}$$
$$t = \text{imul}(a_{k+1} \oplus (a_{k+1} \gg 15), a_{k+1} \mid 1)$$
$$t = t \oplus (t + \text{imul}(t \oplus (t \gg 7), t \mid 61))$$
$$\text{rand}() = \frac{(t \oplus (t \gg 14)) \gg 0}{4294967296}$$

This produces uniform floating point output in $[0, 1)$ deterministically from any string or integer seed.
