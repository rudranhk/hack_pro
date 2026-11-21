"""Conservative recruitment policy for the synthetic demo. Clinical review is external."""
from models import BloodGroup, Component

ALL_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
PLASMA = {"O": {"O", "A", "B", "AB"}, "A": {"A", "AB"}, "B": {"B", "AB"}, "AB": {"AB"}}


def compatible_donor_groups(recipient: BloodGroup, component: Component) -> set[str]:
    if component == "PLASMA":
        return {group for group in ALL_GROUPS if group[:-1] in PLASMA[recipient[:-1]]}
    # Restrict outreach to identical groups for whole blood and platelets.
    # No emergency substitutions or clinical eligibility decisions are modeled.
    return {recipient}
