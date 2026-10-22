/**
 * Server-Sent Events (SSE) Dispatch Service for Real-Time News Stream (Task 101)
 */
class SSEService {
  constructor() {
    this.clients = new Set();
  }

  /**
   * Register a new SSE client HTTP response connection.
   */
  addClient(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    });

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    const client = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      res,
    };

    this.clients.add(client);

    // Initial connection handshake event
    client.res.write(
      `event: connected\ndata: ${JSON.stringify({
        message: 'Connected to The MCC Chronicles Real-Time Broadsheet Stream',
        timestamp: new Date().toISOString(),
        clientId: client.id,
      })}\n\n`
    );

    // Clean up on disconnect
    req.on('close', () => {
      this.clients.delete(client);
    });

    req.on('error', () => {
      this.clients.delete(client);
    });
  }

  /**
   * Broadcast an event and payload to all connected clients.
   * @param {string} event - Event name (e.g. 'dispatch:published', 'circular:urgent')
   * @param {Object} data - Payload data
   */
  broadcast(event, data) {
    if (this.clients.size === 0) return;

    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const message = `event: ${event}\ndata: ${payload}\n\n`;

    for (const client of this.clients) {
      try {
        client.res.write(message);
      } catch (err) {
        console.warn(`Failed to write to SSE client ${client.id}:`, err.message);
        this.clients.delete(client);
      }
    }
  }

  /**
   * Retrieve active connection count.
   */
  getClientCount() {
    return this.clients.size;
  }
}

const sseService = new SSEService();
module.exports = sseService;
