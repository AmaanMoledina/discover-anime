import React from "react";
import "./About.css";

function About() {
  return (
    <div className="about-container">
      <h1 className="about-title">About Discover Anime</h1>
      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          At <strong>Discover Anime</strong>, we aim to make exploring the world of anime effortless and fun. With a vast and ever-expanding collection of anime out there, finding the perfect one to match your mood or interests can feel overwhelming. Our intelligent recommendation system is here to bridge the gap, guiding you to anime tailored to your unique tastes.
        </p>
      </section>
      <section className="about-section">
        <h2>How It Works</h2>
        <p>
          Simply describe the kind of anime you want to watch in the search bar—be as specific or vague as you like! Whether you’re looking for a story about a hero battling demons, a slice-of-life comedy about friendship, or something entirely out of the box, <strong>Discover Anime</strong> uses advanced AI to generate intelligent recommendations. Each result comes with details about why it’s relevant, ratings, and where you can stream it.
        </p>
      </section>
      <section className="about-section">
        <h2>Support Us</h2>
        <p>
          If <strong>Discover Anime</strong> helped you find your next binge-worthy anime, consider supporting us! Your contributions help keep the service running and free for everyone. We’re committed to continuously improving and expanding our features to better serve the anime community.
        </p>
        <p>
          Interested in contributing or giving feedback? <a href="/contact" className="contact-link">Reach out to us here!</a>
        </p>
      </section>
    </div>
  );
}

export default About;
