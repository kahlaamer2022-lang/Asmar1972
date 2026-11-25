export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/pi/approve") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" }
        });
      }
      try {
        const { paymentId } = await request.json();
        if (!env.PI_API_KEY) {
          return new Response(JSON.stringify({ error: "Missing PI_API_KEY" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
        if (!paymentId) {
          return new Response(JSON.stringify({ error: "Missing paymentId" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const piRes = await fetch(
          https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/approve,
          {
            method: "POST",
            headers: {
              "Authorization": Key ${env.PI_API_KEY},
              "Content-Type": "application/json"
            }
          }
        );
        const data = await piRes.text();
        return new Response(data, {
          status: piRes.status,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/api/pi/complete") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" }
        });
      }
      try {
        const { paymentId, txid } = await request.json();
        if (!env.PI_API_KEY) {
          return new Response(JSON.stringify({ error: "Missing PI_API_KEY" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
        if (!paymentId || !txid) {
          return new Response(JSON.stringify({ error: "Missing paymentId or txid" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const piRes = await fetch(
          https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/complete,
          {
            method: "POST",
            headers: {
              "Authorization": Key ${env.PI_API_KEY},
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ txid })
          }
        );
        const data = await piRes.text();
        return new Response(data, {
          status: piRes.status,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};