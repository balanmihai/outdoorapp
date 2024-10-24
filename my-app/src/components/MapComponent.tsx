// src/MapComponent.tsx
import React, { useEffect, useRef } from "react";
import "ol/ol.css"; // Import OpenLayers CSS
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj"; // For coordinate conversion
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString"; // For the trail
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Icon, Stroke, Fill } from "ol/style";

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null); // Reference for the map div

  useEffect(() => {
    if (!mapRef.current) return; // Ensure mapRef is defined

    // Create a new vector source for the markers and trail
    const vectorSource = new VectorSource();

    // Coordinates for Pasul Bratocea and Vf Ciucas (longitude, latitude)
    const pasulBratoceaCoordinates = [24.3905, 45.5404]; // Pasul Bratocea
    const vfCiucasCoordinates = [25.6794, 45.5326]; // Vf Ciucas
    const ciucasPeakCoordinates = [25.6821, 45.5304]; // Ciucas Peak
    const cabanaCiucasCoordinates = [25.6706, 45.5276]; // Cabana Vârful Ciucaș

    // Create features for Pasul Bratocea, Vf Ciucas, Ciucas Peak, and Cabana
    const pasulBratoceaFeature = new Feature({
      geometry: new Point(fromLonLat(pasulBratoceaCoordinates)),
      name: "Pasul Bratocea",
    });

    const vfCiucasFeature = new Feature({
      geometry: new Point(fromLonLat(vfCiucasCoordinates)),
      name: "Vf Ciucas",
    });

    const ciucasPeakFeature = new Feature({
      geometry: new Point(fromLonLat(ciucasPeakCoordinates)),
      name: "Ciucas Peak",
    });

    const cabanaCiucasFeature = new Feature({
      geometry: new Point(fromLonLat(cabanaCiucasCoordinates)),
      name: "Cabana Vârful Ciucaș",
    });

    // Create the trail as a LineString feature
    const trailCoordinates = [
      fromLonLat(ciucasPeakCoordinates),
      fromLonLat(cabanaCiucasCoordinates),
    ];

    const trailFeature = new Feature({
      geometry: new LineString(trailCoordinates),
      name: "Trail from Ciucas Peak to Cabana",
    });

    // Styles for the markers and trail
    const markerStyle = new Style({
      image: new Icon({
        src: "https://openlayers.org/en/v6.5.0/examples/data/icon.png", // Custom icon for markers
        scale: 0.1,
      }),
    });

    const trailStyle = new Style({
      stroke: new Stroke({
        color: "blue", // Color of the trail
        width: 4, // Width of the trail line
      }),
    });

    // Set styles for the features
    pasulBratoceaFeature.setStyle(markerStyle);
    vfCiucasFeature.setStyle(markerStyle);
    ciucasPeakFeature.setStyle(markerStyle);
    cabanaCiucasFeature.setStyle(markerStyle);
    trailFeature.setStyle(trailStyle); // Apply trail style

    // Add the features to the vector source
    vectorSource.addFeature(pasulBratoceaFeature);
    vectorSource.addFeature(vfCiucasFeature);
    vectorSource.addFeature(ciucasPeakFeature);
    vectorSource.addFeature(cabanaCiucasFeature);
    vectorSource.addFeature(trailFeature); // Add the trail feature

    // Initialize the map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(), // Use OpenStreetMap tiles
        }),
        new VectorLayer({
          source: vectorSource, // Add the vector layer with the markers and trail
        }),
      ],
      view: new View({
        center: fromLonLat([25.6794, 45.5326]), // Center the map on Vf Ciucas
        zoom: 13, // Set initial zoom level
      }),
    });

    // Clean up the map instance on component unmount
    return () => map.setTarget(undefined);
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "500px" }} // Set map container size
    />
  );
};

export default MapComponent;
