"""
Synthetic donor pool for the vector store — same spirit as the frontend's mock
data, expanded and spread across blood groups so real searches have something
to differentiate. Each donor gets a short natural-language profile that Gemini
embeds; the structured facts travel alongside as Qdrant payload.
"""

from dataclasses import dataclass

from embeddings import embed_batch
from vector_store import upsert_donors


@dataclass
class SeedDonor:
    id: int
    bloodGroup: str
    distanceKm: float
    available: bool
    responseRate: float
    lastActiveDays: int
    lastActiveLabel: str

    @property
    def profile_text(self) -> str:
        availability = "currently available" if self.available else "currently unavailable"
        return (
            f"Blood donor, group {self.bloodGroup}, located {self.distanceKm} km away, {availability}. "
            f"Historical response rate {round(self.responseRate * 100)} percent to emergency alerts. "
            f"Last active on the platform {self.lastActiveLabel}."
        )


DEMO_DONORS: list[SeedDonor] = [
    SeedDonor(1, "O-", 1.2, True, 0.90, 1, "20m ago"),
    SeedDonor(2, "O-", 1.8, True, 0.82, 1, "3h ago"),
    SeedDonor(3, "O-", 4.6, True, 0.74, 1, "1d ago"),
    SeedDonor(4, "O-", 3.9, True, 0.65, 2, "2d ago"),
    SeedDonor(5, "O-", 2.6, False, 0.30, 21, "3w ago"),
    SeedDonor(6, "O-", 11.5, True, 0.51, 5, "5d ago"),
    SeedDonor(7, "O-", 27.0, True, 0.40, 6, "6d ago"),
    SeedDonor(8, "O+", 2.1, True, 0.71, 1, "6h ago"),
    SeedDonor(9, "O+", 6.4, True, 0.58, 3, "3d ago"),
    SeedDonor(10, "A+", 3.3, True, 0.77, 1, "12h ago"),
    SeedDonor(11, "A+", 8.9, True, 0.44, 9, "9d ago"),
    SeedDonor(12, "A-", 5.1, True, 0.68, 2, "2d ago"),
    SeedDonor(13, "B+", 4.0, True, 0.61, 4, "4d ago"),
    SeedDonor(14, "B-", 9.7, True, 0.55, 5, "5d ago"),
    SeedDonor(15, "AB+", 6.8, True, 0.49, 7, "1w ago"),
    SeedDonor(16, "AB-", 14.2, True, 0.38, 12, "12d ago"),
]


def seed() -> int:
    vectors = embed_batch([d.profile_text for d in DEMO_DONORS])
    points = [
        {
            "id": donor.id,
            "vector": vector,
            "payload": {
                "bloodGroup": donor.bloodGroup,
                "distanceKm": donor.distanceKm,
                "available": donor.available,
                "responseRate": donor.responseRate,
                "lastActiveDays": donor.lastActiveDays,
                "lastActiveLabel": donor.lastActiveLabel,
            },
        }
        for donor, vector in zip(DEMO_DONORS, vectors)
    ]
    return upsert_donors(points)
