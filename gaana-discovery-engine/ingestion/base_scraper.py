from abc import ABC, abstractmethod
from typing import List
from schema import ReviewModel

class BaseScraper(ABC):
    """
    Base class for all data ingestion scrapers.
    Ensures that every source connector outputs a standard list of ReviewModel objects.
    """
    
    @abstractmethod
    def fetch_reviews(self, limit: int = 100) -> List[ReviewModel]:
        """
        Fetch reviews from the source and map them to the unified ReviewModel schema.
        
        :param limit: Maximum number of reviews to fetch.
        :return: A list of validated ReviewModel instances.
        """
        pass
