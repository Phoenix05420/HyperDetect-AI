from neo4j import GraphDatabase
from .config import settings

class Neo4jConnection:
    def __init__(self, uri, user, pwd):
        self.__uri = uri
        self.__user = user
        self.__pwd = pwd
        self.__driver = None
        try:
            self.__driver = GraphDatabase.driver(self.__uri, auth=(self.__user, self.__pwd))
        except Exception as e:
            print("Failed to create the driver:", e)
        
    def close(self):
        if self.__driver is not None:
            self.__driver.close()
            
    def get_driver(self):
        return self.__driver

db_connection = Neo4jConnection(settings.neo4j_uri, settings.neo4j_user, settings.neo4j_password)

def get_db():
    return db_connection.get_driver()
