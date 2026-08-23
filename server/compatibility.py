"""
Standard ABO/Rh donor-recipient compatibility.

This is textbook transfusion-medicine compatibility (not a substitute for
clinical cross-matching) used as a hard filter before ranking — vector
similarity never overrides blood-type compatibility, it only orders within it.
"""

from models import BloodGroup, Component

ALL_GROUPS: list[BloodGroup] = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]

# Whole blood / red cells: donor -> set of recipients that donor is compatible with.
_RBC_COMPATIBLE_RECIPIENTS: dict[BloodGroup, set[BloodGroup]] = {
    "O-": {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},
    "O+": {"O+", "A+", "B+", "AB+"},
    "A-": {"A-", "A+", "AB-", "AB+"},
    "A+": {"A+", "AB+"},
    "B-": {"B-", "B+", "AB-", "AB+"},
    "B+": {"B+", "AB+"},
    "AB-": {"AB-", "AB+"},
    "AB+": {"AB+"},
}

# Plasma compatibility is the mirror of RBC — AB is the universal plasma donor,
# O recipients can receive from anyone. Rh is not a factor for plasma.
_PLASMA_COMPATIBLE_DONOR_ABO: dict[str, set[str]] = {
    "O": {"O", "A", "B", "AB"},
    "A": {"A", "AB"},
    "B": {"B", "AB"},
    "AB": {"AB"},
}


def compatible_donor_groups(recipient: BloodGroup, component: Component) -> set[BloodGroup]:
    """Which donor blood groups may donate `component` to `recipient`."""
    if component == "PLASMA":
        recipient_abo = recipient.rstrip("+-")
        donor_abo_set = _PLASMA_COMPATIBLE_DONOR_ABO[recipient_abo]
        return {g for g in ALL_GROUPS if g.rstrip("+-") in donor_abo_set}

    # WHOLE and PLATELET both follow standard RBC compatibility here (a simplification —
    # platelet matching in reality leans more on ABO-identical preference, not strict RBC rules).
    return {donor for donor, recipients in _RBC_COMPATIBLE_RECIPIENTS.items() if recipient in recipients}
