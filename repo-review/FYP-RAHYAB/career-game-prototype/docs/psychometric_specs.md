# Psychometric Telemetry and Mathematical Specifications
## Reverse-Engineering Enterprise Competency Frameworks

Platforms employing game-based assessments capture thousands of granular data points per session, converting latent cognitive and personality traits into quantifiable signals.

### 1. Behavioral Indicators and Telemetry Tracking
Decomposes reaction time and accuracy into distinct cognitive components via Drift-Diffusion Models (DDM).
- **Input Velocity**: Total interactions divided by active engagement time. Measures fluid motor control, processing speed, and impulsivity. Correlates with Big Five Extraversion and high ICAR spatial rotation confidence.
- **System Stability**: 1 minus the coefficient of variation of inter-action intervals. Tracks temporal variance. High stability suggests superior emotional regulation (low Neuroticism) and meticulous Conscientiousness.
- **Trial-and-Error Frequency**: Ratio of reversed/corrected actions to total actions. Maps strongly to high Openness to Experience but lower initial cognitive precision.
- **Option Exploration Ratio**: Proportion of unique interactive elements engaged before finalizing a decision. Maps strongly to ICAR Matrix Reasoning and RIASEC Investigative traits.

### 2. The ICAR Cognitive Aptitude Model (2PL IRT)
Measures generalized intelligence using Item Response Theory (IRT) Two-Parameter Logistic (2PL) models.
- **Matrix Reasoning**: Fluid intelligence and inductive logic.
- **Three-Dimensional (3D) Rotation**: Spatial reasoning and mental visualization capabilities.
- **Verbal Reasoning**: Deductive logic and semantic relationships.
- **Letter and Number Series**: Working memory and sequential pattern recognition.

### 3. OCEAN (Big Five) Personality Inventories via Graded Response Models
Applies Samejima's Graded Response Model (GRM) to polytomous ordinal parameters to extract independent latent estimates.

### 4. The RIASEC Interest Framework and Circular Congruence
Treats Holland codes as continuous vectors operating within a two-dimensional Euclidean space mapped via Multidimensional Scaling (MDS). Suitability uses cosine similarity multiplied by the hyperbolic tangent (tanh) of profile magnitude.

### 5. Algorithmic Mapping Matrix to Pakistani FBISE Streams
The raw suitability vector is calculated via the matrix dot product between the Stream Transformation Matrix and the candidate's normalized profile vector, finalized using a Softmax activation function with a thermodynamic temperature parameter.

| Psychometric Vector Element | Pre-Med | Pre-Eng | ICS (Comp. Sci) | Commerce (I.Com) | Arts (F.A.) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Telemetry: System Stability | 0.15 | 0.10 | -0.05 | 0.10 | 0.00 |
| Telemetry: Trial & Error | -0.10 | 0.05 | 0.15 | 0.00 | 0.05 |
| DDM: Boundary Separation | 0.10 | 0.10 | 0.05 | 0.05 | 0.00 |
| ICAR: Matrix Reasoning | 0.10 | 0.20 | 0.25 | 0.05 | 0.00 |
| ICAR: 3D Rotation | 0.15 | 0.20 | 0.05 | 0.00 | -0.05 |
| ICAR: Verbal Reasoning | 0.05 | 0.00 | 0.05 | 0.05 | 0.30 |
| ICAR: Letter/Number Series | 0.05 | 0.15 | 0.25 | 0.20 | 0.00 |
| OCEAN: Openness | -0.05 | 0.00 | 0.10 | 0.00 | 0.25 |
| OCEAN: Conscientiousness | 0.20 | 0.10 | 0.00 | 0.25 | -0.05 |
| OCEAN: Neuroticism (Inverted) | -0.05 | -0.05 | 0.00 | 0.00 | 0.10 |
| RIASEC: Investigative | 0.20 | 0.15 | 0.15 | 0.00 | 0.00 |
| RIASEC: Enterprising | 0.00 | 0.00 | 0.00 | 0.30 | 0.05 |
| RIASEC: Artistic | 0.00 | -0.05 | -0.05 | -0.05 | 0.35 |