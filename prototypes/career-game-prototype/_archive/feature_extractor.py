# -*- coding: utf-8 -*-
import math

class GameFeatureExtractor:
    def __init__(self):
        # Operational Accumulators
        self.total_rotations = 0
        self.unique_nodes_interacted = set()
        self.timestamp_history = []
        self.rapid_click_sequences = 0
        self.last_node = None
        self.node_rotation_counts = {}

    def process_telemetry_event(self, validated_event: dict):
        """Ingests raw, validated telemetry blocks to dynamically rebuild target behavioral variables."""
        event_type = validated_event.get("event_type")
        if event_type != "conduit_rotation_step":
            return

        self.total_rotations += 1
        data = validated_event.get("data", {})
        cx = data.get("grid_coordinate_x")
        cy = data.get("grid_coordinate_y")
        current_node = (cx, cy)
        
        self.unique_nodes_interacted.add(current_node)
        self.node_rotation_counts[current_node] = self.node_rotation_counts.get(current_node, 0) + 1

        # Track input spacing and delay latencies
        monotonic_ms = validated_event.get("monotonic_ms", 0.0)
        self.timestamp_history.append(monotonic_ms)

        if len(self.timestamp_history) > 1:
            delta = self.timestamp_history[-1] - self.timestamp_history[-2]
            # Rapid clicks below 300ms signify trial-and-error behaviors rather than spatial calculations
            if delta < 300.0:
                self.rapid_click_sequences += 1

        self.last_node = current_node

    def compile_candidate_profile(self) -> dict:
        """Normalizes and maps game statistics directly to the 13 canonical math keys."""
        # Calculate latent cognitive stability vs chaos metrics
        intervals = []
        for i in range(1, len(self.timestamp_history)):
            intervals.append(self.timestamp_history[i] - self.timestamp_history[i-1])
        
        mean_delay = sum(intervals) / len(intervals) if intervals else 500.0
        
        # 1. System Stability (Emotional Resilience)
        # Higher variation or extreme volatility lowers internal system stability scores
        stability = max(0.0, 1.0 - (self.rapid_click_sequences / max(1, self.total_rotations)))

        # 2. Trial and Error rate
        trial_error = min(1.0, self.rapid_click_sequences / max(1, self.total_rotations))

        # 3. DDM Boundary Separation (Decisiveness Threshold)
        # Long hesitations increase boundary tracking, fast executions represent low margins
        ddm_boundary = min(1.0, mean_delay / 1500.0)

        # 4-7. Cognitive Capacities (Mapped from baseline metrics)
        icar_matrix = min(1.0, len(self.unique_nodes_interacted) / 16.0) # Spatial layout logic exploration
        # High spatial index derived from single nodes edited systematically without frantic clicking
        max_node_rotation = max(self.node_rotation_counts.values()) if self.node_rotation_counts else 1
        icar_3d = max(0.1, 1.0 - (max_node_rotation / max(1, self.total_rotations))) 
        icar_verbal = 0.5  # Populated via Layer 3: Symbolic Venn Alignments
        icar_letter = 0.5  # Populated via Layer 2: Rhythmic Glyph Sequencing

        # 8-13. Personality & Interests matrices placeholders (Grounded inside the shared layer)
        return {
            "system_stability": float(stability),
            "trial_and_error": float(trial_error),
            "ddm_boundary_separation": float(ddm_boundary),
            "icar_matrix_reasoning": float(icar_matrix),
            "icar_3d_rotation": float(icar_3d),
            "icar_verbal_reasoning": float(icar_verbal),
            "icar_letter_number_series": float(icar_letter),
            "ocean_openness": 0.6,
            "ocean_conscientiousness": min(1.0, 4.0 / max(1, len(self.unique_nodes_interacted))),
            "ocean_neuroticism_inverted": float(stability),
            "riasec_investigative": float(icar_3d),
            "riasec_enterprising": 0.4,
            "riasec_artistic": 0.3
        }
