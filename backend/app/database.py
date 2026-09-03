from ravendb import DocumentStore
from .config import settings
import os

class RavenDBConnection:
    def __init__(self, url, database, cert_path):
        self.store = None
        try:
            if cert_path and os.path.exists(cert_path):
                self.store = DocumentStore(urls=[url], database=database, certificate=cert_path)
            else:
                self.store = DocumentStore(urls=[url], database=database)
            self.store.initialize()
        except Exception as e:
            print("Failed to initialize RavenDB DocumentStore:", e)
        
    def close(self):
        if self.store is not None:
            self.store.close()
            
    def get_store(self):
        return self.store

db_connection = RavenDBConnection(
    settings.ravendb_url, 
    settings.ravendb_database, 
    settings.ravendb_certificate_path
)

def get_db():
    return db_connection.get_store()
