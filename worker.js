export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const jsonHeaders = { "Content-Type": "application/json" };

    if (url.pathname === "/api/pi/approve") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: jsonHeaders
        });
      }
      try {
        const body = await request.json();
        const paymentId = body && body.paymentId;
        if (!env.PI_API_KEY) {
          return new Response(JSON.stringify({ error: "Missing PI_API_KEY" }), {
            status: 500,
            headers: jsonHeaders
          });
        }
        if (!paymentId) {
          return new Response(JSON.stringify({ error: "Missing paymentId" }), {
            status: 400,
            headers: jsonHeaders
          });
        }
        const piUrl =
          "https://api.minepi.com/v2/payments/" +
          encodeURIComponent(paymentId) +
          "/approve";
        const piRes = await fetch(piUrl, {
          method: "POST",
          headers: {
            "Authorization": "Key " + env.PI_API_KEY,
            "Content-Type": "application/json"
          }
        });
        const data = await piRes.text();
        return new Response(data, {
          status: piRes.status,
          headers: jsonHeaders
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: jsonHeaders
        });
      }
    }

    if (url.pathname === "/api/pi/complete") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: jsonHeaders
        });
      }
      try {
        const body = await request.json();
        const paymentId = body && body.paymentId;
        const txid = body && body.txid;
        const orderInfo = body && body.orderInfo;

        if (!env.PI_API_KEY) {
          return new Response(JSON.stringify({ error: "Missing PI_API_KEY" }), {
            status: 500,
            headers: jsonHeaders
          });
        }
        if (!paymentId || !txid) {
          return new Response(JSON.stringify({ error: "Missing paymentId or txid" }), {
            status: 400,
            headers: jsonHeaders
          });
        }
        const piUrl =
          "https://api.minepi.com/v2/payments/" +
          encodeURIComponent(paymentId) +
          "/complete";
        const piRes = await fetch(piUrl, {
          method: "POST",
          headers: {
            "Authorization": "Key " + env.PI_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ txid: txid })
        });
        const dataText = await piRes.text();

        if (piRes.ok && env.ORDERS_KV) {
          try {
            const piData = JSON.parse(dataText);
            const uid = piData.user_uid || (orderInfo && orderInfo.uid);
            if (uid) {
              const kvKey = `orders:${uid}`;
              const existingRaw = await env.ORDERS_KV.get(kvKey);
              const existingOrders = existingRaw ? JSON.parse(existingRaw) : [];

              const alreadySaved = existingOrders.some(o => o.paymentId === paymentId);
              if (!alreadySaved) {
                existingOrders.unshift({
                  paymentId: paymentId,
                  txid: txid,
                  productId: (orderInfo && orderInfo.productId) || (piData.metadata && piData.metadata.productId) || "",
                  title: (orderInfo && orderInfo.title) || piData.memo || "Digital Product",
                  amount: piData.amount || (orderInfo && orderInfo.amount) || 0,
                  downloadUrl: (orderInfo && orderInfo.downloadUrl) || "",
                  date: new Date().toISOString()
                });
                await env.ORDERS_KV.put(kvKey, JSON.stringify(existingOrders));
              }
            }
          } catch (kvErr) {
            console.error("KV save error:", kvErr);
          }
        }

        return new Response(dataText, {
          status: piRes.status,
          headers: jsonHeaders
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: jsonHeaders
        });
      }
    }

    if (url.pathname === "/api/orders") {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: jsonHeaders
        });
      }
      const uid = url.searchParams.get("uid");
      if (!uid) {
        return new Response(JSON.stringify({ error: "Missing uid" }), {
          status: 400,
          headers: jsonHeaders
        });
      }
      if (!env.ORDERS_KV) {
        return new Response(JSON.stringify({ orders: [] }), {
          status: 200,
          headers: jsonHeaders
        });
      }
      const raw = await env.ORDERS_KV.get(`orders:${uid}`);
      const orders = raw ? JSON.parse(raw) : [];
      return new Response(JSON.stringify({ orders }), {
        status: 200,
        headers: jsonHeaders
      });
    }

    return env.ASSETS.fetch(request);
  }
};