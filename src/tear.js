#!/usr/bin/env node

/**
 * TEARZ - Deterministic execution layer for OAM TilePacks
 * 
 * Accepts an OAM Image ID and materializes it into a shareable PMTiles URL.
 * 
 * This is NOT a viewer, NOT a tile server, NOT a registry.
 * It is a deterministic execution runtime that waits for TilePack readiness
 * and outputs shareable viewer URLs.
 */

import { TilePackClient } from './tilepack-client.js';

/**
 * Materialize a TilePack into a shareable PMTiles URL
 * @param {string} oamImageId - OAM Image ID
 */
async function materializeTilePack(oamImageId) {
  if (!oamImageId) {
    console.error('Error: OAM Image ID is required');
    console.error('Usage: just tear <oam-image-id>');
    process.exit(1);
  }

  console.log(`Tearing TilePack for OAM Image ID: ${oamImageId}\n`);

  const client = new TilePackClient();

  try {
    // Step 1: Request TilePack
    console.log('Requesting TilePack...');
    await client.requestTilePack(oamImageId);

    // Step 2-3: Poll for readiness
    console.log('Waiting for TilePack to be ready...');
    const pmtilesUrl = await client.waitForReady(oamImageId);

    // Step 4-5: Output results
    const viewerUrl = client.constructViewerUrl(pmtilesUrl);

    console.log('\n✓ TilePack is ready!\n');
    console.log('PMTiles URL:');
    console.log(pmtilesUrl);
    console.log('\nViewer URL:');
    console.log(viewerUrl);

  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

// Run the CLI
const oamImageId = process.argv[2];
materializeTilePack(oamImageId);
