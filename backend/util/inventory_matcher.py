from difflib import get_close_matches

def match_medicines_to_inventory(extracted_medicines: list, inventory_names: list) -> list:

    results = []
    for med in extracted_medicines:
        med_name = med["medicine"]
        quantity = med.get("quantity", "1")

        # Use get_close_matches for fuzzy matching
        matched = get_close_matches(med_name, inventory_names, n=1, cutoff=0.6)

        results.append({
            "medicine": med_name,
            "quantity": quantity,
            "matched_inventory": matched[0] if matched else None
        })

    return results
