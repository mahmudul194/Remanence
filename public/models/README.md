# 3D Models Directory

This directory hosts optional compressed `.glb` models from NASA 3D Resources.

## File Names
To replace the procedural models with custom 3D scans or GLTF files, place your `.glb` files here with these exact names:

- `apollo_lm.glb` — Apollo 11 Lunar Module Descent Stage
- `lrv_rover.glb` — Apollo Lunar Roving Vehicle
- `surveyor.glb` — Surveyor 3 Lunar Lander
- `viking_lander.glb` — Viking 1 Mars Lander
- `pathfinder_sojourner.glb` — Mars Pathfinder Base & Sojourner Rover
- `mer_rover.glb` — Mars Exploration Rover Spirit
- `mer_rover_oppy.glb` — Mars Exploration Rover Opportunity
- `ingenuity.glb` — Ingenuity Mars Helicopter
- `retroreflector.glb` — Apollo Lunar Laser Ranging Retroreflector

## Recommended Settings
- **Format**: Binary GLTF (`.glb`)
- **Compression**: DRACO compression enabled (keeps models < 2.5 MB)
- **Scale**: Centered at origin `(0, 0, 0)`, units in meters
- **NASA 3D Resources**: https://nasa3d.arc.nasa.gov/

*Note: If any file is missing, REMANENCE automatically generates a high-detail procedural model with emissive beacons and custom materials so the experience never breaks.*
