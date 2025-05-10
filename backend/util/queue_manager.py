import redis
import json
import uuid
from datetime import datetime
import random
from typing import Dict, List, Tuple

# Connect to Redis
r = redis.Redis(host="localhost", port=6379, db=0)
 # ✅ String key

# Estimate time based on medicine type
def estimate_time(medicines: List[Dict]) -> int:
    total_seconds = 300  # base 5 minutes buffer
    for med in medicines:
        if med.get("type") == "edge":
            total_seconds += 45
        else:
            total_seconds += 22
    return total_seconds

# Add prescription to queue with cumulative wait time
def add_to_queue(prescription_id: str, medicines: List[Dict]) -> Tuple[str, int]:
    queue_data = json.loads(r.get("mediplus:queue") or "[]")
    

    # Estimate current prescription's packing time
    packing_time = 0
    for med in medicines:
        if med["type"] == "edge":
            packing_time += random.randint(30, 60)
        else:
            packing_time += random.randint(15, 30)

    # Cumulative time from last item in queue
    last_est = queue_data[-1]["est_time"] if queue_data else 0
    estimated_total_time = last_est + packing_time

    entry = {
        "queue_id": str(uuid.uuid4()),
        "prescription_id": prescription_id,
        "medicines": medicines,
        "timestamp": str(datetime.utcnow()),
        "est_time": estimated_total_time
    }

    queue_data.append(entry)
    r.set("mediplus:queue", json.dumps(queue_data))

    return entry["queue_id"], estimated_total_time

# View full queue
def get_queue() -> List[Dict]:
    raw = r.get("mediplus:queue")
    return json.loads(raw or "[]")

# Get total cumulative wait time (useful for display or admin UI)
def get_total_wait_time() -> int:
    queue = get_queue()
    return queue[-1]["est_time"] if queue else 0

# Remove a prescription from queue after pickup
def remove_from_queue(prescription_id: str) -> None:
    queue = get_queue()
    updated_queue = [item for item in queue if item["prescription_id"] != prescription_id]
    r.set("mediplus:queue", json.dumps(updated_queue))
    