# BigQuery Graph Performance Best Practices and Optimization Strategies

## Overview
This document summarizes performance best practices for BigQuery Graph, derived from internal engineering guides and query optimization case studies. It is designed to be consumed by AI agents to understand how to optimize graph workloads on BigQuery.



## 1. User Best Practices: Schema & Query Design

### 1.1 Graph Schema Design
*   **Explicit Property Definition**:
    *   **DO**: Explicitly list properties used in the graph. `PROPERTIES (id, create_time)`
    *   **AVOID**: `PROPERTIES ALL COLUMNS`. This pulls in unused columns, increasing scan I/O.
*   **Constraints**:
    *   Define `PRIMARY KEY` and `FOREIGN KEY` constraints as `NOT ENFORCED`.
    *   *Benefit*: Enables aggressive join elimination and scan reduction.
    *   *Caveat*: Data must actually be unique/referential; otherwise results may be incorrect.

### 1.2 Query Writing Patterns
*   **Start with Low Cardinality**:
    *   Write traversals starting from the most selective node (e.g., specific ID or highly filtered subset).
    *   *Example*: `(p:Person {id: 10})-[...]->(a:Account)` is better than `(p:Person)-[...]->(a:Account {id: 10})` if the engine doesn't reorder it (though quantified path opt helps here).
*   **Directional Traversal**:
    *   **Prefer**: `(a)-[e]->(b)`
    *   **Avoid**: `(a)-[e]-(b)` (Undirected). Undirected traversal effectively unions both directions, doubling work and preventing some optimizations.
*   **Specific Labels**:
    *   Always specify node/edge labels. `(a:Account)-[t:Transfer]->(b:Account)`
    *   Omission causes the engine to scan *all* possible labels that could fit.
*   **Single MATCH Statement**:
    *   Prefer one linear `MATCH` clause over multiple disconnected `MATCH` clauses joined by variables, to allow global cardinality estimation.
*   **ANY / ANY SHORTEST**:
    *   Use `MATCH ANY SHORTEST` or `MATCH ANY` when you only need *connectivity* checks or *one* path, rather than *all* paths.

### 2.3 Advanced Query Tuning (Adapted from Spanner Graph)
*   **Across MATCH Statements**:
    *   **Practice**: When using `NEXT MATCH` or multiple linear `MATCH` statements, **re-specify labels** for variables even if they were defined in a previous step.
    *   *Example*: `MATCH (n:Account) ... NEXT MATCH (n:Account)-[...]-(m)`
    *   *Why*: Helps the optimizer immediately resolve types for `n` in the second fragment without deep dependency analysis.
*   **Handling Supernodes (Limit Edge Traversal)**:
    *   **Problem**: Traversing from high-cardinality nodes ("supernodes") can cause massive fan-out and slow queries.
    *   **Spanner Pattern**: Uses `IS_FIRST` to limit edges per node (e.g., "latest 5 transfers").
    *   **BigQuery Adaptation**: BigQuery Graph does not support `IS_FIRST`. Instead, **use `ROW_NUMBER()`**.
    *   **Implementation**: Apply a `ROW_NUMBER()` filter in a subquery or `LET` clause to select the top-k edges *before* or *during* traversal usage.
    *   *Snippet*:
        ```sql
        -- Equivalent to IS_FIRST logic (use QUALIFY or Subquery)
        QUALIFY ROW_NUMBER() OVER (
            PARTITION BY SOURCE_NODE_ID(e) 
            ORDER BY e.create_time DESC
        ) <= @limit
        ```

---

## 2. Case Study: Fraud Network Query Optimization

This section analyzes a real-world optimization of a fraud detection query.

### 2.1 Scenario
*   **Goal**: Detect "indirect fraud connections" (Source -> Hop1 -> Hop2).
    *   Path: `SourceUser -> [connected_to] -> Hop1User -> [connected_to] -> Hop2User`.
    *   Conditions: Edges must be recent (< 1 hour); Hop2User is "high risk".
*   **Original Query Issues**:
    *   Likely scans too many paths (High Fan-out).
    *   Computes full 2-hop paths for all users before filtering.

### 2.2 Optimization Technique A: Early Aggregation
If the intermediate edge (`first_hop`) details are *not* needed in the final output (or can be aggregated), break the traversal:
1.  **Step 1**: Traverse `Source -> Hop1`.
2.  **Step 2**: `WITH DISTINCT source_user, first_hop_user` (Deduplicate/Aggregate).
3.  **Step 3**: Traverse `Hop1 -> Hop2`.

*Why it works*: Prevents combinatorial explosion. If User A connects to User B via 50 edges, and B connects to C via 50 edges:
*   Standard: 50 * 50 = 2500 paths.
*   Early Aggregation: 1 pair (A, B) -> 50 paths to C = 50 paths (assuming we only care about reachability).

### 2.3 Optimization Technique B: Sampling (Limit Edges)
If the user has massive connectivity (supernode), process only a subset of recent edges.
*   **Strategy**: `ARRAY_AGG(first_hop ORDER BY created_at DESC LIMIT 5)`.
*   **Implementation**:
    1.  Match `Source -> Hop1`.
    2.  `WITH ... ARRAY_AGG(...) as edges`.
    3.  `UNNEST` (flatten) the limited edges.
    4.  Continue traversal to `Hop2`.

### 2.4 Summary of Case Study Recommendations
*   **Use `MATCH ANY SHORTEST`**: For simple connectivity checks.
*   **Filter Early**: Apply "high risk" filters on Hop2 and "recent time" filters on edges immediately.
*   **Limit Fan-out**: Use aggregation or sampling for high-degree nodes. 

## 4. References & Documentation

*   **Spanner Graph Overview**: [Introduction to Spanner Graph](https://cloud.google.com/spanner/docs/reference/standard-sql/graph-intro)
*   **Graph Schema Statements (DDL)**: [CREATE PROPERTY GRAPH, etc.](https://cloud.google.com/spanner/docs/reference/standard-sql/graph-schema-statements)
*   **Graph Query Statements (DQL)**: [MATCH, RETURN, etc.](https://cloud.google.com/spanner/docs/reference/standard-sql/graph-query-statements)
    *   *Includes Graph Patterns (MATCH), Graph Hints, and GQL Subqueries.*
*   **Graph Data Types**: [Graph Element, Graph Path](https://cloud.google.com/spanner/docs/reference/standard-sql/data-types#graph_element_type)
*   **Graph Operators & Predicates**: [Concatenation, Labels, Property Existence](https://cloud.google.com/spanner/docs/reference/standard-sql/operators#graph_concatenation_operator)
    *   *Includes `||` (Concatenation), `IS SOURCE`, `IS DESTINATION`, `IS LABELED`, `PROPERTY_EXISTS`, `SAME`.*
*   **Graph Functions**: [Functions & Operators](https://cloud.google.com/spanner/docs/reference/standard-sql/functions-and-operators)
    *   *Includes `NODES`, `EDGES`, `LABELS`, `PROPERTIES`, `Element Definition definitions`, `TO_JSON` in the alphabetical list.*
*   **Standard SQL Subqueries**: [Subqueries](https://cloud.google.com/spanner/docs/reference/standard-sql/subqueries)
*   **Conditional Expressions**: [CASE, COALESCE, IF, etc.](https://cloud.google.com/spanner/docs/reference/standard-sql/conditional_expressions)
