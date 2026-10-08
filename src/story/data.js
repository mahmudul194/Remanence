/**
 * REMANENCE: What remains.
 * NASA Space Apps Challenge - Team Apollo 404
 * Complete mission data, timeline telemetry, and historical facts.
 * Verified against NASA archives, NSSDC, and JPL mission logs.
 */

export const STORY_DATA = {
  meta: {
    title: "REMANENCE",
    tagline: "What remains.",
    team: "Apollo 404",
    challenge: "Abandoned but Not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars",
    definition: "remanence (n.) - what remains after the force is gone."
  },

  sections: [
    {
      id: "intro",
      type: "intro",
      title: "REMANENCE",
      subtitle: "WHAT REMAINS",
      lead: "> SEARCHING FOR SIGNAL...",
      secondary: "SIGNAL RECEIVED. DSN FREQUENCY LOCKED: 2.295 GHz",
      definition: "remanence (n.)\n1. The residual magnetic flux density left in a magnetic circuit after the removal of the magnetizing force.\n2. The enduring physical traces of human curiosity left silent across other worlds.",
      instruction: "SCROLL TO INITIATE TRAJECTORY"
    },

    {
      id: "earth",
      type: "overview",
      badge: "ORIGIN",
      machine: "PLANET EARTH",
      location: "Low Earth Orbit / Cape Canaveral",
      date: "1969 — PRESENT",
      status: "ACTIVE ORIGIN",
      remanence: "Every footprint on other worlds began here.",
      story: "From this fragile blue marble against the dark, humanity dared to launch metal, glass, and dreams into the vacuum. We sent our mechanical children across the void to see what no human eyes could yet behold.",
      coordinates: "28.5721° N, 80.6480° W"
    },

    {
      id: "apollo11",
      type: "machine",
      badge: "LUNAR SURFACE — 01",
      machine: "Apollo 11 Lunar Module (LM-5 'Eagle')",
      location: "Mare Tranquillitatis (Tranquility Base), Moon",
      lastContact: "July 24, 1969 (Descent Stage Shutdown: July 21, 1969)",
      status: "SILENT",
      remanence: "Descent stage gold foil, stainless steel plaque, and pristine astronaut bootprints in vacuum.",
      story: "On July 20, 1969, Neil Armstrong and Buzz Aldrin brought Eagle down with seconds of fuel remaining. When they fired the ascent engine to rejoin Michael Collins, the descent stage stayed behind. Bolted to its strut is a plaque: 'Here men from the planet Earth first set foot upon the Moon. We came in peace for all mankind.' In the airless lunar silence, the gold Kapton foil still glints in the unfiltered sunlight.",
      coordinates: "0.67408° N, 23.47297° E",
      modelType: "apollo_lm",
      glowColor: 0xffd700,
      lightIntensity: 1.8,
      fact: "The Apollo 11 descent stage contains a silicon disc etched with goodwill messages from 73 world leaders."
    },

    {
      id: "lrv",
      type: "machine",
      badge: "LUNAR SURFACE — 02",
      machine: "Apollo Lunar Roving Vehicles (LRV-1, 2, 3)",
      location: "Hadley Rille (A15), Descartes (A16), Taurus-Littrow (A17)",
      lastContact: "December 14, 1972 (Apollo 17 final departure)",
      status: "SILENT",
      remanence: "Three electric buggies parked facing the lunar sky; tire tracks crisp in the regolith.",
      story: "Between 1971 and 1972, three electric rovers expanded humanity's reach across the Moon. Apollo 17 Commander Eugene Cernan parked LRV-3 a short distance away to capture the ascent stage ignition on camera, wiping dust off the lens one last time. No human hand has touched its steering joystick in over half a century; its zinc-silver batteries have long gone cold under the silent stars.",
      coordinates: "20.1908° N, 30.7717° E (Apollo 17 Site)",
      modelType: "lrv_rover",
      glowColor: 0x4df0ff,
      lightIntensity: 1.6,
      fact: "Apollo 17 astronaut Harrison Schmitt clocked the lunar rover speed record at 11.2 mph down a crater slope."
    },

    {
      id: "surveyor3",
      type: "machine",
      badge: "LUNAR SURFACE — 03",
      machine: "Surveyor 3 Lander",
      location: "Oceanus Procellarum (Ocean of Storms), Moon",
      lastContact: "May 4, 1967 (Inspected by Apollo 12: Nov 19, 1969)",
      status: "SILENT",
      remanence: "Weathered tubular aluminum tripod standing silently inside Surveyor Crater.",
      story: "Surveyor 3 bounced three times before settling in a crater in 1967, proving the lunar regolith could support a spacecraft. In November 1969, Apollo 12 astronauts Pete Conrad and Alan Bean pinpoint-landed just 160 meters away and walked over to visit it. They retrieved its camera to study how machines age in space. It was humanity's first reunion with a solitary machine left behind on an alien world.",
      coordinates: "3.015° S, 23.418° W",
      modelType: "surveyor",
      glowColor: 0xfff4b8,
      lightIntensity: 1.5,
      fact: "Microbes (Streptococcus mitis) retrieved from Surveyor's camera were claimed to survive 2.5 years on the Moon."
    },

    {
      id: "transit",
      type: "transit",
      badge: "DEEP SPACE",
      machine: "THE INTERPLANETARY VOID",
      location: "Translunar to Trans-Mars Injection Corridor",
      lastContact: "INTERMITTENT DEEP SPACE TELEMETRY",
      status: "CROSSING VOID",
      remanence: "225 million kilometers of quiet cosmic radiation and silent orbits.",
      story: "Leaving the Moon behind, the journey stretches into the vast chasm between planetary orbits. Space is not empty; it is filled with solar wind, cosmic rays, and the ghosts of radio signals traveling at the speed of light. Out here, human voices thin into faint telemetry pings echoing across the dark.",
      coordinates: "Heliocentric Orbit (1.52 AU)"
    },

    {
      id: "viking1",
      type: "machine",
      badge: "MARTIAN DESERT — 01",
      machine: "Viking 1 Lander",
      location: "Chryse Planitia (Plains of Gold), Mars",
      lastContact: "November 11, 1982",
      status: "SILENT",
      remanence: "Titanium lander body, meteorology boom, and trench scoops preserved in red dust.",
      story: "On July 20, 1976—seven years to the day after Apollo 11—Viking 1 gave humanity its first color view of Mars: an amber sky over red rocks. It transmitted daily weather, soil chemistry, and images for 2,245 sols until a human command error caused its high-gain antenna to swing away from Earth. Its robotic arm remains poised forever over the rust-colored soil it scooped.",
      coordinates: "22.697° N, 48.222° W",
      modelType: "viking_lander",
      glowColor: 0xffaa44,
      lightIntensity: 1.8,
      fact: "Viking 1 operated on Mars for over 6 Earth years—far surpassing its original 90-day mission plan."
    },

    {
      id: "pathfinder",
      type: "machine",
      badge: "MARTIAN DESERT — 02",
      machine: "Mars Pathfinder & Sojourner",
      location: "Ares Vallis, Mars",
      lastContact: "September 27, 1997",
      status: "SILENT",
      remanence: "The Carl Sagan Memorial Station petals and the 10.5-kg six-wheeled rover circling nearby.",
      story: "Pathfinder bounced onto Mars cushioned inside airbags on July 4, 1997, opening like a flower to release Sojourner—the first wheeled rover to drive on another planet. The tiny microrover sniffed Martian rocks named 'Barnacle Bill' and 'Yogi'. When Pathfinder's nickel-cadmium battery froze in the autumn chill, Sojourner was left circling the base station, following programmed instructions to seek a signal that never came.",
      coordinates: "19.33° N, 33.55° W",
      modelType: "pathfinder_sojourner",
      glowColor: 0x4df0ff,
      lightIntensity: 1.6,
      fact: "Sojourner was named in honor of abolitionist and women's rights activist Sojourner Truth."
    },

    {
      id: "spirit",
      type: "machine",
      badge: "MARTIAN DESERT — 03",
      machine: "Spirit Rover (MER-A)",
      location: "'Troy', Columbia Hills, Gusev Crater, Mars",
      lastContact: "March 22, 2010 (Sol 2210)",
      status: "SILENT",
      remanence: "Six titanium wheels trapped in sulphate sand; solar panels angled toward a cold winter horizon.",
      story: "Designed to drive just 600 meters over 90 days, Spirit battled through rocky terrain for more than six years. In May 2009, its wheels broke through a deceptive crust into powder-fine sulphate sand at a spot called 'Troy'. Trapped and unable to angle its solar arrays toward the sun for the coming winter, Spirit transmitted its final engineering packet on March 22, 2010 before succumbing to hypothermia.",
      coordinates: "14.5684° S, 175.4726° E",
      modelType: "mer_rover",
      glowColor: 0xff8833,
      lightIntensity: 1.7,
      fact: "Spirit's jammed front-right wheel dragged like an anchor, inadvertently furrowing open pure silica—proof of ancient hydrothermal vents."
    },

    {
      id: "opportunity",
      type: "machine",
      badge: "MARTIAN DESERT — 04",
      machine: "Opportunity Rover (MER-B)",
      location: "Perseverance Valley, Endeavour Crater, Mars",
      lastContact: "June 10, 2018 (Sol 5111)",
      status: "SILENT — THE FINAL TWILIGHT",
      remanence: "A marathon path of 45.16 kilometers etched into the red sands; solar wings buried under dust.",
      story: "Opportunity survived 5,111 sols, traversing an entire marathon across alien dunes and finding hematite 'blueberries' forged in ancient groundwater. In June 2018, a catastrophic planet-wide dust storm blotted out the sun, plunging the sky into darkness (tau > 10.8). Its final telemetry transmitted power dropping to 22 watt-hours. Science reporter Jacob Margolis translated its telemetry as: 'My battery is low and it's getting dark.' For eight months NASA beamed Billie Holiday's 'I'll Be Seeing You' into the void, but Oppy never woke up.",
      coordinates: "2.327° S, 354.673° E",
      modelType: "mer_rover_oppy",
      glowColor: 0xff4422,
      lightIntensity: 2.0,
      dustStorm: true,
      fact: "Opportunity holds the all-time off-world driving record: 45.16 km (28.06 miles)."
    },

    {
      id: "ingenuity",
      type: "machine",
      badge: "MARTIAN SKIES — 05",
      machine: "Ingenuity Mars Helicopter ('Ginny')",
      location: "'Valinor Hills', Neretva Vallis, Jezero Crater, Mars",
      lastContact: "Mission Concluded: January 25, 2024 (Last Transmission: April 16, 2024)",
      status: "RETIRED HONORABLY",
      remanence: "Carbon-fiber rotor blades resting upright on sand ripples, silently logging temperature telemetry.",
      story: "Carrying a postage-stamp swatch of fabric from the Wright Brothers' 1903 Flyer, Ingenuity proved powered atmospheric flight is possible in Mars' razor-thin atmosphere. Planned for five test hops, the 1.8-kg drone flew 72 missions across Jezero Crater. On its final landing in January 2024, rotor tip damage ended its flights. Today, Ingenuity stands proud on Valinor Hills, serving as a permanent automated weather station greeting the Martian dawn.",
      coordinates: "18.445° N, 77.451° E",
      modelType: "ingenuity",
      glowColor: 0x66ffaa,
      lightIntensity: 1.9,
      fact: "Ingenuity clocked 128.8 total flight minutes across 17 kilometers, soaring as high as 24 meters."
    },

    {
      id: "retroreflector",
      type: "finale",
      badge: "LUNAR FINALE — THE ENDURING BEACON",
      machine: "Apollo Lunar Laser Ranging Retroreflectors (LRRR)",
      location: "Apollo 11, 14, and 15 Landing Sites, Moon",
      lastContact: "PULSED TODAY (Round-trip time: ~2.56 seconds)",
      status: "PERPETUALLY ACTIVE",
      remanence: "Solid quartz corner-cube prisms bouncing green photon lasers back to Earth right now.",
      story: "Fifty years after human boots left the regolith, there is one Apollo experiment that never shut down. The Lunar Laser Ranging Retroreflectors have no batteries, no computer chips, and no moving parts. Astronomers in Texas, France, and Hawaii still fire high-powered green lasers through telescopes directly at these silent prisms, catching single returning photons to calculate the Moon's distance to millimeter precision.",
      coordinates: "Apollo 11 (23.47° E), Apollo 14 (17.47° W), Apollo 15 (3.63° E)",
      modelType: "retroreflector",
      glowColor: 0x00ff88,
      laserActive: true,
      laserTarget: "Earth Observatory (McDonald / Apache Point)",
      conclusion: "They are not abandoned. They are monuments to human courage, waiting in the dust.\nWhat remains is what we remember."
    }
  ],

  audioTracks: {
    ambientDrone: "ambient_drone",
    radioStatic: "radio_static",
    ping: "sonar_ping",
    glitch: "glitch_burst",
    martianWind: "martian_wind",
    laserPulse: "laser_pulse"
  }
};
