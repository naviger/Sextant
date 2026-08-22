from arango import ArangoClient
from app.core.config import settings
from typing import Optional


class ArangoDB:
    """ArangoDB client wrapper."""
    
    _instance: Optional['ArangoDB'] = None
    _client: Optional[ArangoClient] = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ArangoDB, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self._connect()
    
    def _connect(self):
        """Connect to ArangoDB."""
        try:
            hosts = [settings.DATABASE_URL]
            self._client = ArangoClient(
                hosts=hosts,
                http_client=None,
            )
            
            # Create system database connection for admin operations
            sys_db = self._client.db(
                '_system',
                username=settings.ARANGODB_USER,
                password=settings.ARANGODB_PASSWORD,
            )
            
            # Check if our database exists, if not create it
            if not sys_db.has_database(settings.DATABASE_NAME):
                sys_db.create_database(settings.DATABASE_NAME)
            
            # Connect to application database
            self._db = self._client.db(
                settings.DATABASE_NAME,
                username=settings.ARANGODB_USER,
                password=settings.ARANGODB_PASSWORD,
            )
            
            print(f"Connected to ArangoDB database: {settings.DATABASE_NAME}")
        except Exception as e:
            print(f"Failed to connect to ArangoDB: {e}")
            raise
    
    @property
    def db(self):
        """Get database instance."""
        if self._db is None:
            self._connect()
        return self._db
    
    def get_collection(self, name: str):
        """Get or create collection."""
        if not self.db.has_collection(name):
            self.db.create_collection(name)
        return self.db.collection(name)
    
    def create_index(self, collection_name: str, fields: list, index_type: str = "persistent"):
        """Create index on collection."""
        collection = self.get_collection(collection_name)
        try:
            collection.add_persistent_index(fields)
        except Exception as e:
            print(f"Index creation info: {e}")
    
    def close(self):
        """Close database connection."""
        if self._db:
            self._db = None
        if self._client:
            self._client = None


# Singleton instance
db_client = ArangoDB()


def get_db():
    """Dependency injection for database."""
    return db_client.db
