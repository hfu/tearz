/**
 * TilePackClient
 * 
 * CREAM-bound client for the TilePack API as defined in:
 * https://github.com/hfu/cream/blob/main/spec/tilepack-protocol.md
 * 
 * Implements:
 * - TilePack job initiation
 * - State polling (NOT_STARTED -> STARTED -> IN_PROGRESS -> READY)
 * - PMTiles URL extraction
 * - Exponential backoff
 */

export class TilePackClient {
  constructor() {
    // TilePack API endpoint as defined in CREAM spec
    this.baseUrl = 'https://packager.imagery.hotosm.org/tilepacks';
    
    // Polling configuration
    this.initialDelayMs = 2000;  // Start with 2 seconds
    this.maxDelayMs = 30000;      // Cap at 30 seconds
    this.backoffMultiplier = 1.5; // Exponential backoff multiplier
  }

  /**
   * Request TilePack creation for an OAM Image ID
   * POST https://packager.imagery.hotosm.org/tilepacks/{id}?format=pmtiles
   * 
   * @param {string} oamImageId - OAM Image ID
   * @returns {Promise<Object>} Initial response
   */
  async requestTilePack(oamImageId) {
    const url = `${this.baseUrl}/${oamImageId}?format=pmtiles`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`TilePack request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.cause && error.cause.code === 'ENOTFOUND') {
        throw new Error(`Cannot reach TilePack API at ${this.baseUrl}. Please check network connectivity.`);
      }
      throw error;
    }
  }

  /**
   * Poll TilePack status until READY
   * Implements exponential backoff as required by CREAM spec
   * 
   * @param {string} oamImageId - OAM Image ID
   * @returns {Promise<string>} PMTiles URL when ready
   */
  async waitForReady(oamImageId) {
    let delayMs = this.initialDelayMs;
    let attempts = 0;

    while (true) {
      attempts++;
      
      // Wait before polling (exponential backoff)
      await this.sleep(delayMs);

      // Poll for status
      const status = await this.checkStatus(oamImageId);

      console.log(`  [${attempts}] Status: ${status.status}`);

      // Check if ready
      if (status.status === 'ready') {
        if (!status.url) {
          throw new Error('TilePack is ready but no PMTiles URL was returned');
        }
        return status.url;
      }

      // Validate expected states
      if (!['started', 'in_progress'].includes(status.status)) {
        throw new Error(`Unexpected TilePack status: ${status.status}`);
      }

      // Apply exponential backoff
      delayMs = Math.min(delayMs * this.backoffMultiplier, this.maxDelayMs);
    }
  }

  /**
   * Check TilePack status
   * POST https://packager.imagery.hotosm.org/tilepacks/{id}?format=pmtiles
   * 
   * Note: The endpoint is POST for both initiation and status checking,
   * as defined in the CREAM spec. Repeated requests are expected and normal.
   * 
   * @param {string} oamImageId - OAM Image ID
   * @returns {Promise<Object>} Status response
   */
  async checkStatus(oamImageId) {
    const url = `${this.baseUrl}/${oamImageId}?format=pmtiles`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`TilePack status check failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.cause && error.cause.code === 'ENOTFOUND') {
        throw new Error(`Cannot reach TilePack API at ${this.baseUrl}. Please check network connectivity.`);
      }
      throw error;
    }
  }

  /**
   * Sleep utility for polling delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
