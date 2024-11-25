const express = require("express");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React frontend
app.use(express.static(path.join(__dirname, "build")));

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// Rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per minute
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
});

app.use("/api/recommendations", limiter);

app.post("/api/recommendations", async (req, res) => {
  const { search } = req.body;

  if (!search) {
    return res.status(400).json({ error: "Search query is required." });
  }

  try {
    const chatResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant recommending anime titles. Follow this format exactly and ensure consistency:
      
1. "Anime Title 1" - Reason for relevance. (Confidence: X)
2. "Anime Title 2" - Reason for relevance. (Confidence: X)
3. "Anime Title 3" - Reason for relevance. (Confidence: X)

- Always start each recommendation with a number followed by a period.
- Enclose the anime title in double quotes.
- After the title, provide a reason, followed by "(Confidence: X)" where X is a number between 1 and 10.
- Ensure there are exactly 3 entries in the list.`,
          },
          { role: "user", content: `I want to watch an anime about ${search}` },
        ],
      },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
    );

    const rawResponse = chatResponse.data.choices[0].message.content;
    res.json({ recommendations: rawResponse });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Failed to fetch recommendations." });
  }
});

// Serve React frontend for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
