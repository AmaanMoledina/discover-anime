import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import "./Home.css";
import logo from "./DiscoverAnimelogo.png";
import TypeIt from "typeit-react";
const API_BASE_URL = "/api/recommendations";


// Set Modal root element
Modal.setAppElement("#root");

function Home() {
  const [search, setSearch] = useState("");
  const [animeList, setAnimeList] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Constants
  const JIKAN_API_URL = "https://api.jikan.moe/v4";

  // Define your loading animation clips here
  const animeClips = [
    "https://media.giphy.com/media/YXUCDszoiVGOA/giphy.gif",
    "https://media.giphy.com/media/F9MwjJeXB1w5GONd7X/giphy.gif",
    "https://media.giphy.com/media/3pTtbLJ7Jd0YM/giphy.gif"
  ];
  

  // Loading animation effect
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % animeClips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading,animeClips.length]);

  const truncateText = (text, limit) => {
    if (text.length > limit) {
      return text.substring(0, limit) + "...";
    }
    return text;
  };

  const StarRating = ({ rating }) => {
    const stars = Array.from({ length: 10 }, (_, index) => (
      <span
        key={index}
        style={{
          color: index < Math.round(rating) ? "#FFD700" : "#ddd",
          fontSize: "1.5rem",
          marginRight: "2px",
        }}
      >
        ★
      </span>
    ));
    return <div>{stars}</div>;
  };

  
  const fetchStreamingPlatforms = async (title) => {
    try {
      const url = `https://graphql.anilist.co`;
  
      const query = `
        query ($title: String) {
          Media(search: $title, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            siteUrl
            streamingEpisodes {
              title
              url
              site
            }
          }
        }
      `;
  
      const variables = {
        title: title,
      };
  
      const response = await axios.post(
        url,
        { query, variables },
        { headers: { "Content-Type": "application/json" } }
      );
  
      const media = response.data.data.Media;
  
      if (media) {
        // Extract streaming episode details
        const streamingServices = media.streamingEpisodes?.map((episode) => ({
          name: episode.site || "Unknown",
          url: episode.url || "#",
          episodeTitle: episode.title || "Episode", // Add episode title
        }));
  
        return streamingServices && streamingServices.length > 0
          ? streamingServices
          : [{ name: "AniList", url: media.siteUrl }];
      } else {
        console.warn(`"${title}" not found on AniList.`);
        return [];
      }
    } catch (error) {
      console.error(`Error checking AniList availability for "${title}":`, error.message);
      return [];
    }
  };
  

  const fetchAnimeDetails = async (animeTitle) => {
    try {
      const response = await axios.get(`${JIKAN_API_URL}/anime`, {
        params: { q: animeTitle, limit: 1 },
      });
  
      if (response.data.data.length === 0) {
        console.warn(`No results found for "${animeTitle}"`);
        return null;
      }
  
      const animeData = response.data.data[0];
      const streamingServices = await fetchStreamingPlatforms(animeTitle);
  
      return {
        id: animeData.mal_id,
        title: animeData.title,
        year: animeData.aired?.from?.split("-")[0] || "Unknown",
        rating: animeData.rating || "Unknown",
        genres: animeData.genres.map((g) => g.name).join(", "),
        description: animeData.synopsis || "No description available.",
        image: animeData.images.jpg.large_image_url,
        cast: animeData.studios.map((studio) => studio.name).join(", ") || "Unknown",
        score: animeData.score || "N/A",
        scoredBy: animeData.scored_by || 0,
        streamingServices, // Updated
      };
    } catch (error) {
      console.error(`Error fetching details for "${animeTitle}":`, error.message);
      return null;
    }
  };
  

  const parseChatGPTResponse = (responseText) => {
    return responseText
      .split("\n")
      .map((line) => {
        try {
          const match = line.match(
            /^[0-9]+\.\s*["“”](.*?)["“”]\s*-\s*(.*?)(?:\s*\(Confidence:\s*(\d+)\))?$/
          );
          if (!match) throw new Error(`Invalid format: ${line}`);
          return {
            title: match[1]?.trim() || "Unknown",
            reason: match[2]?.trim() || "No reason provided.",
            confidence: parseInt(match[3] || "0", 10),
          };
        } catch (error) {
          console.warn(`Error parsing line: ${error.message}`);
          return null;
        }
      })
      .filter(Boolean);
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setError("Please enter a valid anime you are imagining.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
        const response = await axios.post(`${API_BASE_URL}`, {
            search,
      });
  
      const rawResponse = response.data.recommendations;
      const parsedResponse = parseChatGPTResponse(rawResponse);
  
      const animeDetails = [];
      for (let item of parsedResponse) {
        const details = await fetchAnimeDetails(item.title.trim());
        if (details) {
          animeDetails.push({
            ...details,
            reason: item.reason,
            confidence: item.confidence,
          });
        }
      }
  
      setAnimeList(animeDetails);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || "Failed to fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="home">
   <header className="header">
  <div className="logo-container">
    <img src={logo} height="150" alt="Discover Anime Logo"/>
    <h1>Discover Anime</h1>
  </div>
  <p className="tagline">Find the perfect anime for your next binge!</p>
  <div className="search-bar">
  <div className="search-input-container">
    {!search && (
      <div className="typeit-placeholder">
        <TypeIt
          options={{
            strings: [
              "I want to watch an anime about time travel...",
              "I want to watch an anime about samurai in space...",
              "I want to watch an anime about magical girls...",
              "I want to watch an anime about Christmas...",
              "I want to watch an anime about cute cheerleaders..."
            ],
            speed: 50,
            breakLines: false,
            loop: true,
            cursor: false,
          }}
        />
      </div>
    )}
    <input
      type="text"
      className="search-input"
      placeholder= "I want to watch an anime about..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
    <button onClick={handleSearch} disabled={loading}>
      {loading ? "Searching..." : "Search"}
    </button>
  </div>
</div>

  {error && <p className="error-message">{error}</p>}
</header>



{loading ? (
  <div className="loading-container">
    {animeClips.length > 0 && (
      <img
        src={animeClips[loadingIndex]}
        alt="Loading Animation"
        className="loading-gif"
      />
    )}
    <p>Fetching your recommendations...</p>
  </div>
) : (
  <section className="anime-grid">
    {animeList.map((anime, index) => (
      <div
        key={`${anime.id}-${index}`}
        className="anime-card"
        onClick={() => setSelectedAnime(anime)}
      >
        <img src={anime.image} alt={anime.title} className="anime-image" />
        <div className="card-content">
          <h3 className="anime-title">{anime.title}</h3>
          <p className="anime-description">{truncateText(anime.description, 70)}</p>
          <div className="card-footer">
            <span className="confidence">Confidence: {anime.confidence}/10</span>
          </div>
        </div>
      </div>
    ))}
  </section>
)}


<Modal
  isOpen={!!selectedAnime}
  onRequestClose={() => {
    setSelectedAnime(null);
    setShowFullDescription(false);
  }}
  className="modern-modal-content"
  overlayClassName="modern-modal-overlay"
>
  {selectedAnime && (
    <div className="modal-container">
      <button className="close-button" onClick={() => setSelectedAnime(null)}>
        ×
      </button>
      <div className="modal-banner-container">
        <img src={selectedAnime.image} alt={selectedAnime.title} className="modal-banner" />
      </div>
      <div className="modal-content">
        <h1 className="modal-title">{selectedAnime.title}</h1>
        <div className="meta-info">
          <span className="rating-badge">{selectedAnime.rating}</span>
          <div className="genre-badges">
            {selectedAnime.genres.split(", ").map((genre, index) => (
              <span key={index} className="genre-badge">{genre}</span>
            ))}
          </div>
        </div>
        <div className="relevance-section">
          <h3>Reason for our recommendation:</h3>
          <div className="relevance-title">
            
          </div>
          <p className="relevance-reason">{selectedAnime.reason}</p>
        </div>
        <div className="star-rating">
          <h3>Rating:</h3>
          <StarRating rating={selectedAnime.score} />
          <p>({selectedAnime.scoredBy} votes)</p>
        </div>
        <p className="description">
          {showFullDescription
            ? selectedAnime.description
            : truncateText(selectedAnime.description, 150)}
        </p>
        {selectedAnime.description.length > 150 && (
          <button
            className="read-more-button"
            onClick={() => setShowFullDescription((prev) => !prev)}
          >
            {showFullDescription ? "Read Less" : "Read More"}
          </button>
        )}
      <div className="streaming-section">
  <h3>Where to Watch:</h3>
  {selectedAnime.streamingServices.length > 0 ? (
    <div className="streaming-services">
      {selectedAnime.streamingServices.map((service, index) => (
        <div key={index} className="streaming-service">
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="streaming-episode-link"
          >
            <img
              src={`https://via.placeholder.com/100x60?text=${encodeURIComponent(
                service.name
              )}`} // Placeholder image for now
              alt={`${service.name} logo`}
              className="streaming-logo"
            />
            <div>
              <span>{service.name}</span>
              <p className="episode-title">{service.episodeTitle}</p>
            </div>
          </a>
        </div>
      ))}
    </div>
  ) : (
    <p>This anime is not available on Crunchyroll or other platforms.</p>
  )}
</div>




      </div>
    </div>
  )}
</Modal>

<footer className="donation-footer">
  <p>
    Enjoyed using Discover Anime? Consider supporting me by donating!
  </p>
  <a
    href="https://venmo.com/amaan-moledina"
    target="_blank"
    rel="noopener noreferrer"
    className="donate-button"
  >
    Donate via Venmo
  </a>
</footer>



    </div>
  );
}

export default Home;
