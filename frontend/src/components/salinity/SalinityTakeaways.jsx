import React from "react";

const takeaways = [
  {
    number: "01",
    title: "Salinity varies geographically",
    description:
      "Different regions experience different combinations of evaporation, rainfall, freshwater input and circulation.",
  },
  {
    number: "02",
    title: "Evaporation increases salinity",
    description:
      "When water evaporates, dissolved salts largely remain in the ocean, increasing concentration.",
  },
  {
    number: "03",
    title: "Rainfall can reduce salinity",
    description:
      "Precipitation adds freshwater to the surface and can dilute seawater.",
  },
  {
    number: "04",
    title: "Freshwater changes ocean structure",
    description:
      "River discharge, melting ice and other freshwater sources can create lower-salinity surface layers.",
  },
  {
    number: "05",
    title: "Salinity affects density",
    description:
      "At a given temperature, saltier seawater is generally denser than less salty seawater.",
  },
  {
    number: "06",
    title: "Temperature and salinity work together",
    description:
      "Together they influence seawater density and therefore contribute to the movement of ocean water.",
  },
];

const SalinityTakeaways = () => {
  return (
    <div className="salinity-takeaways">

      <div className="takeaways-header">

        <div>
          <span className="salinity-section-label">
            SECTION 07
          </span>

          <h2>What you should know</h2>
        </div>

        <span className="takeaways-count">
          06 CONCEPTS
        </span>

      </div>

      <div className="takeaways-grid">

        {takeaways.map((item) => (
          <article
            className="takeaway-card"
            key={item.number}
          >

            <span className="takeaway-number">
              {item.number}
            </span>

            <h3>
              {item.title}
            </h3>

            <p>
              {item.description}
            </p>

          </article>
        ))}

      </div>

      <div className="takeaways-reflection">

        <span>
          REFLECT
        </span>

        <p>
          If two ocean regions have the same temperature but
          different salinities, which water would you expect
          to be denser? What environmental processes could
          explain the difference?
        </p>

      </div>

    </div>
  );
};

export default SalinityTakeaways;