import random
EDGE_CASES = ["syrup", "injection", "suspension", "cream", "ointment", "drops", "gel"]

def estimate_packing_time(medicine_list: list[str]) -> float:
    total_time = 0
    for med in medicine_list:
        med_lower = med.lower()
        if any(edge in med_lower for edge in EDGE_CASES):
            total_time += random.randint(30, 60)  # Edge-case meds
        else:
            total_time += random.randint(15, 30)  # Regular meds
    return round(total_time, 2)  


