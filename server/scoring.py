"""
The displayed match score stays a transparent, weighted formula — same five
factors and weights as the frontend's "Why this donor?" breakdown (40/25/15/12/8).

Vector similarity (Gemini + Qdrant) is used to *retrieve and pre-order*
candidates efficiently, not as an opaque number shown to the hospital. This is
deliberate: "explainable donor ranking" is a product requirement, and cosine
similarity over an embedding isn't explainable to a non-technical user in the
way "23/25 on proximity" is.
"""

from models import ScoreBreakdown


def score_candidate(
    *,
    exact_blood_match: bool,
    distance_km: float,
    review_on_file: bool,
    response_rate: float,
    last_active_days: int,
) -> tuple[ScoreBreakdown, int]:
    compatibility = 40 if exact_blood_match else 28
    proximity = max(0, min(25, round(25 - distance_km * 0.6)))
    eligibility_margin = 15 if review_on_file else 0
    response_history = max(0, min(12, round(12 * response_rate)))
    recent_activity = max(0, min(8, round(8 - last_active_days * 0.5)))

    breakdown = ScoreBreakdown(
        compatibility=compatibility,
        proximity=proximity,
        eligibilityMargin=eligibility_margin,
        responseHistory=response_history,
        recentActivity=recent_activity,
    )
    total = compatibility + proximity + eligibility_margin + response_history + recent_activity
    return breakdown, total
