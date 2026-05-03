import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", 8011))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("DEBUG", "true").lower() == "true" else False,
        log_level="info",
    )
