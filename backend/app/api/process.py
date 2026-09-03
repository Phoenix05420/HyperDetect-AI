from fastapi import APIRouter
router = APIRouter()
@router.post("/{dataset_id}")
async def process_dataset(dataset_id: str):
    return {"message": f"Processing {dataset_id}"}
