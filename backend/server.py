from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import os
import uuid
from pymongo import MongoClient
from pymongo.collection import Collection

# Load environment variables
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# MongoDB setup
client = MongoClient(mongo_url)
db = client.music_collection
items_collection: Collection = db.items

app = FastAPI(title="Music Collection API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class MusicItemCreate(BaseModel):
    artist: str
    album_title: str
    year_of_release: int
    genre: str
    purchase_date: str
    format: str  # "CD" or "LP"
    cover_image_url: Optional[str] = None

class MusicItemResponse(BaseModel):
    id: str
    artist: str
    album_title: str
    year_of_release: int
    genre: str
    purchase_date: str
    format: str
    cover_image_url: Optional[str] = None
    created_at: datetime

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Music Collection API is running"}

@app.post("/api/items", response_model=MusicItemResponse)
async def create_item(item: MusicItemCreate):
    # Create new item with UUID
    new_item = {
        "id": str(uuid.uuid4()),
        "artist": item.artist,
        "album_title": item.album_title,
        "year_of_release": item.year_of_release,
        "genre": item.genre,
        "purchase_date": item.purchase_date,
        "format": item.format,
        "created_at": datetime.utcnow()
    }
    
    result = items_collection.insert_one(new_item)
    if result.inserted_id:
        return MusicItemResponse(**new_item)
    else:
        raise HTTPException(status_code=500, detail="Failed to create item")

@app.get("/api/items", response_model=List[MusicItemResponse])
async def get_items(format: Optional[str] = None):
    query = {}
    if format:
        query["format"] = format
    
    items = list(items_collection.find(query, {"_id": 0}))
    
    # Sort by artist then genre
    items.sort(key=lambda x: (x["artist"].lower(), x["genre"].lower()))
    
    return [MusicItemResponse(**item) for item in items]

@app.get("/api/items/{item_id}", response_model=MusicItemResponse)
async def get_item(item_id: str):
    item = items_collection.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return MusicItemResponse(**item)

@app.put("/api/items/{item_id}", response_model=MusicItemResponse)
async def update_item(item_id: str, item: MusicItemCreate):
    update_data = {
        "artist": item.artist,
        "album_title": item.album_title,
        "year_of_release": item.year_of_release,
        "genre": item.genre,
        "purchase_date": item.purchase_date,
        "format": item.format
    }
    
    result = items_collection.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated_item = items_collection.find_one({"id": item_id}, {"_id": 0})
    return MusicItemResponse(**updated_item)

@app.delete("/api/items/{item_id}")
async def delete_item(item_id: str):
    result = items_collection.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)