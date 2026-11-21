AquaTrace --- Tracking the Vanishing Edge of Water
AquaTrace is a student hackathon prototype focused on making changes
in ponds and lakes easier to observe. The project concept uses satellite
observations to compare water-covered areas across different dates and
visually communicate possible shoreline recession.
Prototype status: This starter website currently contains
illustrative demo data and graphics. It does not yet perform verified
satellite-image analysis. Replace the sample values and demo location
with real, validated project data before presenting results as
factual.

Problem
Small ponds and lakes can gradually lose water-covered area. Changes may
be difficult to notice consistently until they become obvious on the
ground. Communities, farmers, and environmental teams need accessible
ways to view and compare changes over time.
Proposed Solution
AquaTrace aims to provide a simple web-based water-body explorer where
users can:
- Locate a pond or lake on an interactive map.
- Select a water body for monitoring.
- Compare observations from different dates.
- View changes in estimated water-covered area.
- See historical shoreline boundaries and identify locations that may
  need further investigation.
Current Website Features
The current prototype includes:
- Responsive landing page and project introduction.
- Interactive map powered by Leaflet and OpenStreetMap.
- Demo water-body marker and search field.
- Date selection for an illustrative comparison.
- Sample water-area change calculation.
- Project workflow and impact sections.
- Responsive navigation for smaller screens.
Technology Stack
- HTML5 --- website structure
- CSS3 --- layout, styling, and responsive design
- JavaScript --- map setup and interactive demo functions
- Leaflet --- interactive map
- OpenStreetMap --- map tiles
The current version is a front-end prototype. A backend and
satellite-processing pipeline can be added as the project develops.
Run Locally
1. Download or clone this repository.
2. Open the project folder.
3. Open index.html in a web browser.
An internet connection is required for the external Leaflet library and
map tiles.
Suggested Next Development Steps
1. Select a real pond or lake as the study area.
2. Collect suitable satellite observations from two or more dates.
3. Use a water-detection method, such as a suitable water index, to
   create water masks.
4. Validate the detected water boundaries against imagery and, where
   possible, field observations.
5. Calculate water-covered area for each date and compare the results.
6. Display actual boundaries and clearly label dates, units, data
   sources, and uncertainty.
7. Add a backend or data service if required for the final deployment.
Important Data Note
The current demo values and abstract shoreline graphics are not real
satellite-derived measurements. The demo marker is only a placeholder.
Do not use the displayed sample change percentage as evidence of actual
pond recession.

For a credible final prototype, document:
- Water-body name and location
- Satellite source and image dates
- Cloud or image-quality limitations
- Water-detection method
- Area calculation method and units
- Validation approach
Project Goal
AquaTrace seeks to make water-body change easier to see and understand
by turning satellite observations into a clear visual story.

Built by a student team for the ASTRA hackathon --- Domain 02: Earth
Observation & Satellite Applications.
