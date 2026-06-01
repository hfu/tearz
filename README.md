# TEARZ

A deterministic execution layer that materializes OAM TilePacks into shareable PMTiles URLs.

## What TEARZ is

TEARZ is **not**:
- A viewer
- A tile server
- A registry system

TEARZ **is**:
- A deterministic execution runtime that:
  1. Accepts an OAM Image ID
  2. Waits for TilePack API readiness
  3. Retrieves a PMTiles URL
  4. Outputs a shareable viewer URL

The output artifact is the URL, not the map.

## CREAM Integration

TEARZ is CREAM-bound and relies on CREAM `/spec` definitions for:
- OAM Image ID semantics
- TilePack API endpoint structure
- Readiness state model
- PMTiles URL generation rules

Reference: https://github.com/hfu/cream/tree/main/spec

## Installation

```bash
# Clone the repository
git clone https://github.com/hfu/tearz.git
cd tearz

# No dependencies to install (uses Node.js built-in fetch)
```

## Usage

### Using just (recommended)

```bash
just tear <oam-image-id>
```

Example:

```bash
just tear 6a18bf8e8a50e594a322d68a
```

### Using Node.js directly

```bash
node src/tear.js <oam-image-id>
```

## Execution Model

For a given OAM Image ID, TEARZ executes the following steps:

### Step 1 — Resolve TilePack Request
Interpret the ID as an OAM Image identifier.

### Step 2 — Query TilePack API
Call the TilePack API defined by CREAM spec:
```
POST https://packager.imagery.hotosm.org/tilepacks/{id}?format=pmtiles
```

### Step 3 — Wait for Readiness
If status != "ready":
- Poll with exponential backoff
- Continue until ready
- Do NOT fail early
- Do NOT fake results

### Step 4 — Extract PMTiles URL
When ready:
- Extract PMTiles URL from API response
- MUST be absolute URL
- MUST NOT be modified

### Step 5 — Output Viewer URL
Construct:
```
https://pmtiles.io/?url=<pmtiles-url>
```

## Output Format

```
PMTiles URL:
<pmtiles-url>

Viewer URL:
https://pmtiles.io/?url=<pmtiles-url>
```

## Determinism

Same OAM Image ID MUST always:
- Call same API path
- Follow same polling logic
- Produce same PMTiles URL
- Produce same viewer URL

No randomness allowed.

## Architecture

Minimal implementation:
- CLI entry: `just tear <id>`
- API client: TilePack API adapter (CREAM-bound)
- Poller: Readiness loop with exponential backoff
- Materializer: Extracts PMTiles URL
- Output formatter

## Philosophy

> CREAM defines meaning.
> 
> TEARZ executes reality.

The system does not "render maps".

It waits for a system to become ready, then materializes a URL that represents a geospatial state.

## Constraints

- No local registry (/maps is forbidden)
- No hardcoded datasets
- No example.com or placeholder URLs
- No fake data generation
- No hidden orchestration layers
- No frameworks required
- Explicit control flow only
- Deterministic execution required

## Requirements

- Node.js 18+ (uses built-in fetch API)
- just command runner (optional, for convenience)

## License

ISC

