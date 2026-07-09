const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = JSON.parse(event.body);
    const { amount, items, customer } = body;

    if (!amount || !items || !customer) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Dados incompletos' }) };
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      // Deixar o Stripe gerir automaticamente os métodos activos na conta
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
      description: `Viveiros da Gabrieira — ${items.length} produto(s)`,
      receipt_email: customer.email,
      metadata: {
        customer_name: customer.name,
        customer_email: customer.email,
        items: JSON.stringify(items.map(i => `${i.name} x${i.qty}`)),
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };

  } catch (error) {
    console.error('Erro Stripe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
