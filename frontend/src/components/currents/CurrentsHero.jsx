import React from 'react';
import './CurrentsHero.css';

const CurrentsHero = ({ onLaunchGlobe }) => {
  return (
    <section className="currents-hero">
      <div className="currents-hero-top">
        <div>
          <div className="currents-eyebrow">LEARNING MODULE 03</div>
          <h1>Ocean Currents</h1>
          <p className="currents-hero-tagline">
            Follow the moving pathways that redistribute heat, nutrients and energy across the ocean.
          </p>
        </div>

        <div className="currents-hero-copy">
          Ocean currents are not just horizontal streams. Wind, Earth’s rotation,
          density differences and the shape of the ocean basins combine to create
          a global circulation system.
        </div>
      </div>

      <div className="currents-hero-visual">
        <div className="hero-wave wave-one" />
        <div className="hero-wave wave-two" />
        <div className="hero-wave wave-three" />
        <div className="hero-orbit" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-core">CURRENT<br />SYSTEM</div>
      </div>

      <div className="currents-hero-footer">
        <div>
          <span>CORE QUESTION</span>
          <strong>Why does ocean water move?</strong>
        </div>

        <button className="currents-primary-button" onClick={onLaunchGlobe}>
          EXPLORE LIVE OCEAN DATA →
        </button>
      </div>
    </section>
  );
};

export default CurrentsHero;
