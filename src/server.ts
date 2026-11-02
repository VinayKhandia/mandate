import Fastify from 'fastify';

const fastify = Fastify({
  logger: true,
});

// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'ok',
    service: 'mandate-firewall',
    timestamp: new Date().toISOString(),
  };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Mandate Firewall running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
