from fastapi import APIRouter, Body
from util.queue_manager import add_to_queue, get_queue, get_total_wait_time

router = APIRouter()

@router.post("/queue/add")
def add_prescription_to_queue(
    prescription_id: str = Body(...),
    medicines: list = Body(...)
):
    queue_id, est_time = add_to_queue(prescription_id, medicines)
    full_queue = get_queue()
    position = next((i+1 for i, q in enumerate(full_queue) if q["prescription_id"] == prescription_id), -1)
    total_wait = get_total_wait_time()

    return {
        "queue_id": queue_id,
        "your_estimated_time": est_time,
        "your_position_in_queue": position,
        "total_estimated_wait_time": total_wait
    }

@router.get("/queue")
def view_entire_queue():
    return get_queue()
